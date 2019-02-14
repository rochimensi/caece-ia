# caece-ia
Proyecto Final Universidad CAECE: Clasificador de usuarios de Facebook con reconocimiento de imágenes

# configuracion
1) Ejecutar sobre el directorio /controller.
    -npm install python-shell
    -npm install

2) Hacer las siguientes modificaciones dentro del archivo label_image.py:
 
 Modificar estas 4 variables con la ruta absoluta a los archivos retrained_graph.pb, retrained_labels.txt, output.txt y la imagen de ejemplo.

 # model_file = "C:/Users/NG/Documents/caece-ia/tensor-model/tf_files/retrained_graph.pb"
 # label_file = "C:/Users/NG/Documents/caece-ia/tensor-model/tf_files/retrained_labels.txt"
 # file_name = 'C:/Users/NG/Documents/caece-ia/tensor-model/examples/example7.jpg'
 # output_txt = 'C:/Users/NG/Documents/caece-ia/controller/tflow/output.txt'

3) Ejecutar node server.js

4) Resultados ./caece-ia/controller/tflow/output.txt

# endpoints
Clasificador de imagenes: http://localhost:3000/imageClassifier
Clasificador de nombres: http://localhost:3000/nameClassifier


