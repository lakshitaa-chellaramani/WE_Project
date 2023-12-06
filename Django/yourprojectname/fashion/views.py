from django.shortcuts import render
from .model.fileupload import save_uploaded_file
from .model.file import feature_extraction,recommend,feature_list,model, filenames
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import os


# Create your views here.
from django.http import HttpResponse

def hello_world(request):
    return JsonResponse({"message":"Hello World"})


@csrf_exempt
def recommendimage(request):
    if request.method == 'POST':
        # print(request.POST)
        try:
            # print('files', request.FILES)
            # if True:
                
            if request.POST.get('imagePath'):
                imagePath = request.POST['imagePath']
                # print(imagePath)
                # # imagePath = save_uploaded_file(image)
                # # print('image', image)
                # print("Line no 26",imagePath)
                # features = feature_extraction(request.POST.get('imagePath'),model)
                # features = feature_extraction(r"C:\Users\my792\Downloads\fashionpy\fashionpy\fashion-recommender-system\backend\uploads\batman.jpg",model)
                print(imagePath)
                features = feature_extraction(imagePath,model)

                indices = recommend(features,feature_list)
                data = []
                for index in indices[0]:
                    data.append(filenames[index])
                return JsonResponse({"indices":data})
            
            else: 
                return HttpResponse("Image Not Found")
        except Exception as e:
            return JsonResponse({"error": e},  status=500)
    else:
        return JsonResponse({"error": "Request not acceptable"},  status=406)


