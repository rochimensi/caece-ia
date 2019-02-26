from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import sys
import time
import glob

import numpy as np
import tensorflow as tf
import json
import requests



def load_graph(model_file):
  graph = tf.Graph()
  graph_def = tf.GraphDef()

  with open(model_file, "rb") as f:
    graph_def.ParseFromString(f.read())
  with graph.as_default():
    tf.import_graph_def(graph_def)

  return graph

def read_tensor_from_image_file(file_name, input_height=299, input_width=299,
				input_mean=0, input_std=255):
  input_name = "file_reader"
  output_name = "normalized"
  file_reader = tf.read_file(file_name, input_name)
  if file_name.endswith(".png"):
    image_reader = tf.image.decode_png(file_reader, channels = 3,
                                       name='png_reader')
  elif file_name.endswith(".gif"):
    image_reader = tf.squeeze(tf.image.decode_gif(file_reader,
                                                  name='gif_reader'))
  elif file_name.endswith(".bmp"):
    image_reader = tf.image.decode_bmp(file_reader, name='bmp_reader')
  else:
    image_reader = tf.image.decode_jpeg(file_reader, channels = 3,
                                        name='jpeg_reader')
  float_caster = tf.cast(image_reader, tf.float32)
  dims_expander = tf.expand_dims(float_caster, 0);
  resized = tf.image.resize_bilinear(dims_expander, [input_height, input_width])
  normalized = tf.divide(tf.subtract(resized, [input_mean]), [input_std])
  sess = tf.Session()
  result = sess.run(normalized)

  return result

def load_labels(label_file):
  label = []
  proto_as_ascii_lines = tf.gfile.GFile(label_file).readlines()
  for l in proto_as_ascii_lines:
    label.append(l.rstrip())
  return label

if __name__ == "__main__":
 
  
  model_file = "C:/Users/NG/Documents/caece-ia-v2/controller/tflow/tf_files/retrained_graph.pb"
  label_file = "C:/Users/NG/Documents/caece-ia-v2/controller/tflow/tf_files/retrained_labels.txt"
  input_height = 128
  input_width = 128
  input_mean = 0
  input_std = 128
  input_layer = "input"
  output_layer = "final_result"
  output_txt = 'C:/Users/NG/Documents/caece-ia-v2/controller/tflow/output.txt'
  data = {}  
  data['followers'] = [] 
  data['results'] = []  
  tot_mujer = 0
  tot_hombre = 0
  tot_generic = 0

  graph = load_graph(model_file)

 
  followers_list = []
  with open('C:/Users/NG/Documents/caece-ia/server/src/followers/followers_usernames.txt','r') as data_file:
    for line in data_file:
      followers_list = line.strip().split(",")
      for follower in followers_list:
        parc_mujer = 0
        parc_hombre = 0
        parc_generic = 0
        parc_imagen = 0
        file_name = "C:/Users/NG/Documents/caece-ia/server/src/followers/"+follower+'/'+follower+'.jpg'
        """Clasifico unicamente la imagen de perfil"""
        t = read_tensor_from_image_file(file_name,
                                        input_height=input_height,
                                        input_width=input_width,
                                        input_mean=input_mean,
                                        input_std=input_std)
        input_name = "import/" + input_layer
        output_name = "import/" + output_layer
        input_operation = graph.get_operation_by_name(input_name);
        output_operation = graph.get_operation_by_name(output_name);
        with tf.Session(graph=graph) as sess:
          start = time.time()
          results = sess.run(output_operation.outputs[0],
                            {input_operation.outputs[0]: t})
          end=time.time()
        results = np.squeeze(results)
        top_k = results.argsort()[-5:][::-1]
        labels = load_labels(label_file)

        template_desc = "{}"
        template_perc = "{:0.5f}"
        for i in top_k:
          if (float(template_perc.format(results[i])) > 0.80):
            parc_imagen += 1
            label = template_desc.format(labels[i])
            if (label == 'hombre'):
              parc_hombre += 1
            elif (label == 'mujer'):
              parc_mujer += 1
            elif (label == 'logo'):
              parc_generic += 1
        
        """call Genderize API"""
        url = 'https://api.genderize.io/?name=juan'
        response = requests.get(url)
        json_data = json.loads(response.text)
        print(json_data['gender'])
        print(json_data['probability'])

        
        