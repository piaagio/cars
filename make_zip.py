
import zipfile
import os

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        # Exclude .git directory
        if '.git' in dirs:
            dirs.remove('.git')
        if 'car' in dirs: # Exclude sub-car folder if it's recursive
             dirs.remove('car')
        
        for file in files:
            if file == 'car_deploy.zip' or file == 'make_zip.py' or file.endswith('.apk'):
                continue
            
            src_path = os.path.join(root, file)
            rel_path = os.path.relpath(src_path, path)
            print(f"Adding {rel_path}...")
            ziph.write(src_path, rel_path)

if __name__ == '__main__':
    with zipfile.ZipFile('car_deploy.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipdir('.', zipf)
    print("car_deploy.zip created successfully.")
