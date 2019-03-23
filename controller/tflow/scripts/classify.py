# -*- coding: utf-8 -*-

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse
import sys
import time
import glob
import os

import numpy as np
import tensorflow as tf
import json
import requests


def classification(graph):
  label_file = "../controller/tflow/tf_files/retrained_labels.txt"
  input_txt_followers = "../server/src/followers/followers_usernames.txt"
  output_txt_path = "../server/src/followers/classification.txt"
  img_folder_path = "../server/src/followers/images/"
  input_height = 224
  input_width = 224
  input_mean = 224
  input_std = 224
  input_layer = "input"
  output_layer = "final_result"
  data = {}  
  data['followers'] = [] 
  data['results'] = []
  tot_mujer = 0
  tot_hombre = 0
  tot_musico = 0
  tot_tecno = 0
  tot_animal = 0
  tot_generic = 0
  tot_deporte = 0

  """A partir del archivos followers_usernames.txt armo un array
  con sus respectivos directorios donde se van a guardar las imagenes"""
  followers_list = []
  if (os.stat(output_txt_path).st_size == 0):
    print("Archivo de salida vacio, se inicializa")
    with open(output_txt_path, 'w') as outfile:  
      json.dump(data, outfile)
    
  with open(input_txt_followers,'r') as data_file:
    for line in data_file:
      followers_list = line.strip().split(",")
      for follower in followers_list:
        """Si es un follower no clasificado"""
        if follower not in open(output_txt_path).read():
          print("Follower no clasificado:")
          print(follower)
          json_user_file=open(output_txt_path,encoding="utf8").read()
          user_data = json.loads(json_user_file)

          parc_musico = 0
          parc_tecno = 0
          parc_animal = 0
          parc_imagen = 0
          parc_deporte = 0
          porc_mujer = 0
          porc_hombre = 0
          porc_generic = 0
          
          print("Comenzando clasificacion individual del follower:")
          print(follower)
          json_data = json.loads(json.dumps(firstClassification(graph,follower)))
          print("Fin clasificacion individual del follower")

          """Itero las imagenes que hay en cada folder de follower y las clasifico"""
          print("Comenzando clasificacion posteos del follower:")
          print(follower)
          for filename in glob.glob(img_folder_path+follower+'/*.jpg'): 
              file_name = filename.replace('\\\\',"//")
              print("Leyendo imagen:")
              print(file_name)  
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
                  if (label == 'animal'):
                    parc_animal += 1
                  elif (label == 'tecnologia'):
                    parc_tecno += 1
                  elif (label == 'deporte'):
                    parc_deporte +=1
                  elif (label == 'musicos'):  
                    parc_musico += 1
          
          porc_animal = 0
          porc_tecno = 0
          porc_musico = 0
          porc_deporte = 0
          if (parc_imagen != 0):
            porc_animal = parc_animal/parc_imagen 
            porc_tecno = parc_tecno/parc_imagen  
            porc_musico = parc_musico/parc_imagen 
            porc_deporte = parc_deporte/parc_imagen

          bol_mujer = 0
          bol_hombre = 0
          bol_generic = 0
          bol_animal = 0
          bol_tecno = 0
          bol_musico = 0
          bol_deporte = 0

          if(json_data[0]["mujer"] == 1):
            bol_mujer = 1
            porc_mujer = json_data[0]["porcMujer"]
            tot_mujer += 1
          if(json_data[0]["hombre"] == 1):
            bol_hombre = 1
            porc_hombre = json_data[0]["porcHombre"]
            tot_hombre += 1
          if(json_data[0]["generico"] == 1):
            bol_generic = 1
            porc_generic = json_data[0]["porcGenerico"]
            tot_generic += 1
          if(porc_animal > 0.4):
            bol_animal = 1
            tot_animal += 1
          if(porc_tecno > 0.4):
            bol_tecno = 1
            tot_tecno += 1
          if(porc_musico > 0.4):
            bol_musico = 1
            tot_musico += 1
          if (porc_deporte > 0.4):
            bol_deporte = 1
            tot_deporte += 1

          newData = {}
          newData[follower] = {
            'mujer': bol_mujer,
            'porcMujer':porc_mujer,
            'hombre': bol_hombre,
            'porcHombre': porc_hombre,
            'animales': bol_animal,
            'porcAnimal':porc_animal,
            'tecnologia':bol_tecno,
            'porcTecnologia':porc_tecno,
            'musica':bol_musico,
            'porcMusico':porc_musico,
            'generico':bol_generic,
            'porcGenerico':porc_generic,
            'deporte':bol_deporte,
            'porcDeporte':porc_deporte
          }

          newDataTotals = {
            'mujer': tot_mujer,
            'hombre': tot_hombre,
            'generico':tot_generic
          }

          user_data["followers"].append(newData)
          with open(output_txt_path, 'w') as outfile:  
            json.dump(user_data, outfile)

    json_user_file=open(output_txt_path,encoding="utf8").read()
    user_data = json.loads(json_user_file)

    if (user_data["results"] != []):
      if ('mujer' in user_data["results"][0]):
        tot_mujer = tot_mujer + int(user_data["results"][0]["mujer"])
        
      if ('hombre' in user_data["results"][0]):
        tot_hombre = tot_hombre + int(user_data["results"][0]["hombre"])

      if ('generico' in user_data["results"][0]):
        tot_generic = tot_generic + int(user_data["results"][0]["generico"])

    newDataTotals = {
      'mujer': tot_mujer,
      'hombre': tot_hombre,
      'generico':tot_generic
    }

    if (user_data["results"] != []):
      user_data["results"][0] = newDataTotals
    else:    
      user_data["results"].append(newDataTotals)
    
    with open(output_txt_path, 'w') as outfile:  
      json.dump(user_data, outfile)

    
    
  return data

def firstClassification(graph,follower):
  label_file = "../controller/tflow/tf_files/retrained_labels.txt"
  input_json_followers = "../server/src/followers/followers.json"
  file_name = "../server/src/followers/images/"+follower+'/'+follower+'.jpg'
  genderize_endpoint_url = "https://api.genderize.io/"
  input_height = 224
  input_width = 224
  input_mean = 224
  input_std = 224
  input_layer = "input"
  output_layer = "final_result"
  tot_mujer = 0
  tot_hombre = 0
  tot_generic = 0
  data = [] 
  followers_list = []
  parc_mujer = 0
  parc_hombre = 0
  parc_generic = 0
  porc_mujer = 0
  porc_hombre = 0
  porc_generic = 0
  porc_mujer_img = 0
  porc_hombre_img = 0
  porc_generic_img = 0
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
    if (float(template_perc.format(results[i])) > 0.75):
      label = template_desc.format(labels[i])
      if (label == 'hombre'):
        parc_hombre += 1
        porc_hombre_img = template_perc.format(results[i])
        print("procentaje img hombre")
        print(template_perc.format(results[i])) 
      elif (label == 'mujer'):
        parc_mujer += 1
        porc_mujer_img = template_perc.format(results[i]) 
        print("procentaje img mujer")
        print(template_perc.format(results[i])) 
      elif (label == 'logo'):
        parc_generic += 1
        porc_generic_img = template_perc.format(results[i])
        print("procentaje img generic")
        print(template_perc.format(results[i])) 
  
  with open(input_json_followers, 'r',encoding='utf-8') as f:
    """json_user_file=open(input_json_followers,encoding="utf8").read()"""
    json_user_file = f.read()
    user_data = json.loads(json_user_file)
  
  name = ""
  if (parc_generic == 0):
    if (user_data[follower].get('fullName')):
      try:
        user_name = user_data[follower]['fullName'].encode('utf-8')
        name = str(user_name).split(" ",1)[0]
        name = name.replace("b'","")
        name = name.replace('\\xc3\\xa1','a')
        name = name.replace('\\xc3\\xa9','e')
        name = name.replace('\\xc3\\xad','i')
        name = name.replace('\\xc3\\xb3','o')
        name = name.replace('\\xc3\\xba','u')
        print("Comenzando clasificacion del nombre del follower de nombre:")
        print(name)  
        url = genderize_endpoint_url + "?name=" + name
        response = requests.get(url)
        print("Response API Name")
        print(response.text)
        json_data = json.loads(response.text)
        if (json_data.get('gender') and json_data['gender'] == 'male'):
          if (json_data['probability'] > 0.80):
            porc_hombre += json_data['probability'] 
            parc_hombre = 1
        elif (json_data.get('gender') and json_data['gender'] == 'female'):
          if (json_data['probability'] > 0.80):
            porc_mujer += json_data['probability'] 
            parc_mujer = 1
        print("Fin clasificacion del nombre del follower")
      except:
        print ("Error en la lectura del fullName del usuario")

  print("Parcial HOMBRE")
  print(parc_hombre)
  print("Parcial MUJER")
  print(parc_mujer)
  print("Parcial GENERICO")
  print(parc_generic)
  if (parc_hombre == 1):
    print("es hombre")
    if(porc_hombre > 0):
      print("y clasifico su nombre")
      print(porc_hombre_img)
      porc_hombre = float((float(porc_hombre) * 0.65) + (float(porc_hombre_img) * 0.35))
      print(porc_hombre)
    else:
      print("y no clasifico su nombre")
      print(porc_hombre_img)
      porc_hombre = porc_hombre_img
      print(porc_hombre)

  if (parc_mujer == 1):
    print("es mujer")
    if(porc_mujer > 0):
      print("y clasifico su nombre")
      print(porc_mujer_img)
      porc_mujer = float(float(porc_mujer) * 0.65 + float(porc_mujer_img) * 0.35)
      print(porc_mujer)
    else:
      print("y no clasifico su nombre")
      print(porc_mujer_img)
      porc_mujer = porc_mujer_img
      print(porc_mujer)

  data.append({
                'mujer': parc_mujer,
                'porcMujer':porc_mujer,
                'hombre': parc_hombre,
                'porcHombre': porc_hombre,
                'generico':parc_generic,
                'porcGenerico': porc_generic_img
              },
  )
  print(data)
  return data

def load_graph(model_file):
  graph = tf.Graph()
  graph_def = tf.GraphDef()

  with open(model_file, "rb") as f:
    graph_def.ParseFromString(f.read())
  with graph.as_default():
    tf.import_graph_def(graph_def)

  return graph

def read_tensor_from_image_file(file_name, input_height=224, input_width=224,
				input_mean=224, input_std=224):
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
  dims_expander = tf.expand_dims(float_caster, 0)
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
  model_file = "../controller/tflow/tf_files/retrained_graph.pb"
  graph = load_graph(model_file)
  final_results = classification(graph)
 
  print("Fin de la clasificacion")




        
        