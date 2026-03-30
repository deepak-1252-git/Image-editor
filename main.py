from flask import Flask, request ,render_template,send_from_directory
from PIL import Image
from pdf2image import convert_from_path
import os
import time
    
app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def front():
    return render_template('switch.html')

@app.route('/resizer', methods=['GET','POST'])
def resize_image():
    if request.method == 'POST':
        if 'image' not in request.files:
            return "No image uploaded", 400
        
        file = request.files.get('image')
        width = request.form.get('width')
        height = request.form.get('height')

        if not file or not width or not height:
            return "Missing data", 400

        width = int(width)
        height = int(height)

        filename = file.filename
        input_path = os.path.join(UPLOAD_FOLDER, filename)

        name, ext = os.path.splitext(filename)
        unique_name = f"resized_{int(time.time())}{ext}"
        output_path = os.path.join(OUTPUT_FOLDER, unique_name)

        file.save(input_path)

        img = Image.open(input_path)
        resized = img.resize((width, height))
        resized.save(output_path)

        # 👇 Image details
        file_size = round(os.path.getsize(output_path) / 1024, 2)  # KB
        resolution = resized.size  # (width, height)

        return render_template('resize_result.html',filename=unique_name,
                                file_size=file_size,resolution=resolution)
    # 👉 GET request ke liye page load karo
    return render_template('resize.html')
         
# Size function 
def format_size(size_kb):
    if size_kb < 1024:
        return f"{round(size_kb, 2)} KB"
    elif size_kb < 1024 * 1024:
        return f"{round(size_kb / 1024, 2)} MB"
    else:
        return f"{round(size_kb / (1024 * 1024), 2)} GB"

@app.route('/compressor', methods=['GET','POST'])
def compress_image():
    if request.method == 'POST':
        if 'image' not in request.files:
            return "No image uploaded", 400
        
        file = request.files.get('image')
        target_size = request.form.get('target_size')

        if not file or not target_size:
            return "Missing data", 400
        
        target_size = int(target_size)

        filename = file.filename
        input_path = os.path.join(UPLOAD_FOLDER, filename)

        name,   ext = os.path.splitext(filename)
        unique_name = f"compressed_{int(time.time())}{ext}"
        output_path = os.path.join(OUTPUT_FOLDER, unique_name)

        file.save(input_path)

        img = Image.open(input_path)
        # RGB convert (important for JPG)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        quality = 90
        while quality > 10:
            img.save(output_path, "JPEG", quality=quality, optimize=True)
            current_size_kb = os.path.getsize(output_path) / 1024
            if current_size_kb <= target_size:
                break
            quality -= 5

        # Size calculation (KB me)
        original_size_kb = os.path.getsize(input_path) / 1024
        compressed_size_kb = os.path.getsize(output_path) / 1024
        # Details
        original_size = format_size(original_size_kb)
        compressed_size = format_size(compressed_size_kb)
        reduction = round(((original_size_kb - compressed_size_kb) / original_size_kb) * 100, 2)

        return render_template('compress_result.html',filename=unique_name,
            original_size=original_size,compressed_size=compressed_size,
            reduction=reduction
        )
    return render_template('compress.html')

@app.route('/convertor', methods=['GET','POST'])
def convert_image():
    if request.method == 'POST':

        files = request.files.getlist('image')
        convert_type = request.form.get('type')  

        if not files or not convert_type:
            return "Missing file or type", 400

        output_files = []

        if convert_type == "multi_img_to_single_pdf":
            image_list = []

            for file in files:
                if file.filename == "":
                    continue

                filename = file.filename
                input_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(input_path)

                img = Image.open(input_path)

                if img.mode == "RGBA":
                    img = img.convert("RGB")

                image_list.append(img)
            
            if not image_list:
                return "No valid images", 400

            #single PDF banega
            output_filename = f"converted_{int(time.time())}.pdf"
            output_path = os.path.join(OUTPUT_FOLDER, output_filename)

            image_list[0].save(output_path,save_all=True,append_images=image_list[1:])

            return render_template('convert_result.html',files=[output_filename],
                    filename=output_filename,file_type="PDF" )

        for file in files:
            if file.filename == "":
                continue

            filename = file.filename
            input_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(input_path)
            
            if convert_type == "pdf-to-img":
                images = convert_from_path(input_path)

                output_filename = f"converted_{int(time.time())}.jpg"
                output_path = os.path.join(OUTPUT_FOLDER, output_filename)

                images[0].save(output_path, "JPEG")

            else:
                img = Image.open(input_path)

                if convert_type == 'png-to-jpg':
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")

                    output_filename = f"converted_{int(time.time())}.jpg"
                    output_path = os.path.join(OUTPUT_FOLDER, output_filename)
                    img.save(output_path, "JPEG")

                elif convert_type == 'jpg-to-png':
                    output_filename = f"converted_{int(time.time())}.png"
                    output_path = os.path.join(OUTPUT_FOLDER, output_filename)
                    img.save(output_path, "PNG")

                elif convert_type == "single_img_to_single_pdf":
                    if img.mode == "RGBA":
                        img = img.convert("RGB")

                    output_filename = f"converted_{int(time.time())}.pdf"
                    output_path = os.path.join(OUTPUT_FOLDER, output_filename)
                    img.save(output_path, "PDF")

                else:
                    return "Invalid conversion type"
                
            output_files.append(output_filename)

        file_type = output_filename.split('.')[-1].upper()
                
        return render_template('convert_result.html', files=output_files,filename=output_files[0],file_type=file_type)
    return render_template('convert.html')

# # 🔽 download route
@app.route('/outputs/<filename>')
def get_output_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
