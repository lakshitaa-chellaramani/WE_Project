from django.core.files.uploadedfile import InMemoryUploadedFile
import os

def save_uploaded_file(upload_file):
    if isinstance(upload_file, InMemoryUploadedFile):
        # Define the directory where you want to save the file
        upload_directory = 'uploads'
        
        # Ensure the directory exists, create it if necessary
        if not os.path.exists(upload_directory):
            os.makedirs(upload_directory)

        # Combine the directory path and file name
        file_path = os.path.join(upload_directory, upload_file.name)

        # Save the file to the specified path
        with open(file_path, 'wb+') as destination:
            for chunk in upload_file.chunks():
                destination.write(chunk)

        return file_path
    else:
        raise ValueError("Invalid file type provided. Expected InMemoryUploadedFile.")
