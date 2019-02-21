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


  graph = load_graph(model_file)

 
  """A partir del archivos followers_usernames.txt armo un array
  con sus respectivos directorios donde se van a guardar las imagenes"""
  followers_list = []
  with open('C:/Users/NG/Documents/caece-ia/server/src/followers/followers_usernames.txt','r') as data_file:
    for line in data_file:
      followers_list = line.strip().split(",")
      for follower in followers_list:
        """Itero las imagenes que hay en cada folder de follower y las clasifico"""
        for filename in glob.glob("C:/Users/NG/Documents/caece-ia/server/src/followers/"+follower+'/*.jpg'): 
            file_name = filename.replace('\\\\',"//")
            print(filename.replace('\\\\',"//"))
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
              print (template_perc.format(results[i]))
              if (float(template_perc.format(results[i])) > 0.60):
                print(template_desc.format(labels[i]))
            
            """JSON"""
            data['followers'].append({
              follower: {
                'mujer': '1',
                'hombre': '0',
                'animal': '0',
                'tecnologia':'0'
              },
            })
            print(data)
                





