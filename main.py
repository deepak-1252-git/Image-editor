from flask import Flask, request ,render_template,send_from_directory,jsonify
from PIL import Image
from pdf2image import convert_from_path
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
import os, time, uuid
  
app = Flask(__name__)

UPLOAD_FOLDER = "/tmp"
OUTPUT_FOLDER = "/tmp"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def front():
    return render_template('switch.html')

@app.route('/resizer', methods=['GET', 'POST'])
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

        file_size = round(os.path.getsize(output_path) / 1024, 2)
        resolution = resized.size

        # render_template ki jagah jsonify return karoy
        return jsonify({
            "filename": unique_name,
            "file_size": file_size,
            "resolution": resolution
        })
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

        return jsonify({"filename": unique_name,"original_size": original_size,
            "compressed_size": compressed_size,"reduction": reduction })
    return render_template('compress.html')

from flask import jsonify
import uuid

@app.route('/convertor', methods=['GET', 'POST'])
def convert_image():
    if request.method == 'POST':
        files = request.files.getlist('image')
        convert_type = request.form.get('type')

        if not files or not convert_type:
            return jsonify({"error": "Missing file or type"}), 400

        output_files = []
        
        # Mapping for regular image formats
        format_map = {
            'png-to-jpg': ('JPEG', 'jpg'),
            'jpg-to-png': ('PNG', 'png'),
            'to-webp': ('WEBP', 'webp'),
            'to-bmp': ('BMP', 'bmp'),
            'to-gif': ('GIF', 'gif'),
            'pdf-to-jpg' : ('JPEG', 'jpg'),
            'single_img_to_single_pdf': ('PDF', 'pdf')
        }

        # --- CASE 1: Multiple Images to ONE PDF ---
        if convert_type == "multi_img_to_single_pdf":
            image_list = []
            for file in files:
                img = Image.open(file)
                if img.mode in ("RGBA", "P"): img = img.convert("RGB")
                image_list.append(img)
            
            output_filename = f"merged_{int(time.time())}.pdf"
            output_path = os.path.join(OUTPUT_FOLDER, output_filename)
            image_list[0].save(output_path, save_all=True, append_images=image_list[1:])
            output_files.append({"name": output_filename, "type": "PDF"})

        # --- CASE 2: PDF to Image (Fixing this part) ---
        elif convert_type == "pdf-to-jpg":
            for file in files:
                # Pehle PDF file ko temp save karna padega convert_from_path ke liye
                temp_input_path = os.path.join(UPLOAD_FOLDER, file.filename)
                file.save(temp_input_path)
                
                try:
                    # Poppler use karke PDF ki pehli page convert karein
                    images = convert_from_path(temp_input_path)
                    if images:
                        unique_name = f"pdf_conv_{uuid.uuid4().hex[:8]}.jpg"
                        output_path = os.path.join(OUTPUT_FOLDER, unique_name)
                        images[0].save(output_path, "JPEG")
                        output_files.append({"name": unique_name, "type": "JPG"})
                except Exception as e:
                    print(f"PDF Error: {e}")
                    continue

        # --- CASE 3: Normal Image Formats ---
        else:
            for file in files:
                img = Image.open(file)
                ext_info = format_map.get(convert_type)
                
                if not ext_info: continue
                
                pill_format, extension = ext_info
                # RGBA handling for formats that don't support it
                if pill_format in ["JPEG", "PDF", "BMP"] and img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                unique_name = f"conv_{uuid.uuid4().hex[:8]}.{extension}"
                output_path = os.path.join(OUTPUT_FOLDER, unique_name)
                img.save(output_path, pill_format)
                output_files.append({"name": unique_name, "type": extension.upper()})

        return jsonify({"files": output_files})

    return render_template('convert.html')

@app.route('/pdf_tool', methods=['GET', 'POST'])
def pdf_tool():
    if request.method == 'POST':
        files = request.files.getlist('pdfs')
        pdf_type = request.form.get('type')
        page_val = request.form.get('page')
        password = request.form.get('password') # Naya Feature

        if not files or not pdf_type:
            return jsonify({"error": "Missing file or type"}), 400

        output_filename = f"pdf_{int(time.time())}_{uuid.uuid4().hex[:5]}.pdf"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)

        try:
            # --- MERGE LOGIC ---
            if pdf_type == "merge-pdf":
                merger = PdfMerger()
                for file in files:
                    merger.append(file)
                merger.write(output_path)
                merger.close()

            # --- SPLIT LOGIC ---
            elif pdf_type == "split-pdf":
                reader = PdfReader(files[0])
                writer = PdfWriter()
                
                # Range logic (e.g. 1-5 or 3)
                if '-' in page_val:
                    start, end = map(int, page_val.split('-'))
                    for i in range(start-1, min(end, len(reader.pages))):
                        writer.add_page(reader.pages[i])
                else:
                    writer.add_page(reader.pages[int(page_val)-1])
                
                with open(output_path, "wb") as f:
                    writer.write(f)

            # --- PASSWORD PROTECTION (Naya Feature) ---
            elif pdf_type == "lock-pdf":
                reader = PdfReader(files[0])
                writer = PdfWriter()
                for page in reader.pages:
                    writer.add_page(page)
                writer.encrypt(password)
                with open(output_path, "wb") as f:
                    writer.write(f)

            return jsonify({
                "filename": output_filename,
                "type": "PDF"
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return render_template('pdftool.html')

# Upload Original Image
@app.route('/upload', methods=['POST'])
def upload_image():
    file = request.files['image']

    filename = str(uuid.uuid4()) + ".jpg"
    path = os.path.join(UPLOAD_FOLDER, filename)

    img = Image.open(file)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img.save(path)

    return jsonify({"filename": filename})

@app.route('/crop_rotate', methods=['GET','POST'])
def crop_rotate():
    if request.method == 'POST':
        file = request.files['image']
        filename = str(uuid.uuid4()) + ".jpg"
        path = os.path.join(OUTPUT_FOLDER, filename)

        img = Image.open(file)
        img = img.convert("RGB")
        img.save(path, "JPEG", quality=95)

        return jsonify({"filename": filename})
    return render_template('croprotate.html')

# # 🔽 download route
@app.route('/outputs/<filename>')
def get_output_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename,as_attachment=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    # app.run(debug=True)
     
