from flask import Flask, request, jsonify, send_from_directory
import json
import os
import hashlib
import base64

app = Flask(__name__, static_folder='.')

@app.route('/')
@app.route('/index.html')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

@app.route('/products.json', methods=['GET', 'DELETE', 'POST'])
def products_api():
    path = os.path.join('.', 'products.json')
    if request.method == 'GET':
        try:
            with open(path, 'r') as f:
                return jsonify(json.load(f))
        except FileNotFoundError:
            return jsonify([
                {"id": 1, "nome": "Produto 1", "preco": 29.90},
                {"id": 2, "nome": "Produto 2", "preco": 49.90},
                {"id": 3, "nome": "Produto 3", "preco": 79.90}
            ])
    elif request.method == 'DELETE':
        id_to_delete = request.json.get('id')
        try:
            with open(path, 'r') as f:
                products = json.load(f)
            updated = [p for p in products if p.get('id') != id_to_delete]
            with open(path, 'w') as f:
                json.dump(updated, f, indent=2)
            # Delete image if exists
            for p in products:
                if p.get('id') == id_to_delete and 'imagem' in p:
                    img_path = p['imagem']
                    if os.path.exists(img_path):
                        os.remove(img_path)
            return jsonify({'status': 'Produto excluído e imagem removida'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'No JSON data'}), 400
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    return jsonify({'status': 'products.json SALVO OK'})

@app.route('/pedidos.json', methods=['GET', 'POST'])
def pedidos_api():
    path = os.path.join('.', 'pedidos.json')
    if request.method == 'GET':
        try:
            with open(path, 'r') as f:
                return jsonify(json.load(f))
        except FileNotFoundError:
            return jsonify([])
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'No JSON data'}), 400
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    return jsonify({'status': 'pedidos.json SALVO OK'})

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
        os.makedirs('images', exist_ok=True)
        filename = 'images/' + str(int(os.times()[4] * 1000)) + '_' + file.filename
        file.save(filename)
        return jsonify({'filename': filename})
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/add-product', methods=['POST'])
def add_product():
    nome = request.form.get('nome', '').strip()
    try:
        preco = float(request.form.get('preco', 0))
    except ValueError:
        return jsonify({'error': 'Preço inválido'}), 400
    
    if not nome or preco <= 0:
        return jsonify({'error': 'Nome e preço > 0 obrigatórios'}), 400
    
    if 'image' not in request.files:
        return jsonify({'error': 'Arquivo de imagem não enviado'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
        return jsonify({'error': 'Tipo de arquivo inválido'}), 400
    
    os.makedirs('images', exist_ok=True)
    safe_nome = nome.replace(' ', '_').replace('/', '_').replace('\\', '_')
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
    new_filename = f"images/imagem_{safe_nome}.{ext}"
    
    # Evitar sobrescrita
    counter = 1
    original_filename = new_filename
    while os.path.exists(new_filename):
        name_part = original_filename.rsplit('.', 1)[0]
        new_filename = f"{name_part}_{counter}.{ext}"
        counter += 1
    
    file.save(new_filename)
    
    # Carregar produtos atuais
    path = 'products.json'
    try:
        with open(path, 'r') as f:
            products = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        products = []
    
    new_id = max([p.get('id', 0) for p in products], default=0) + 1
    new_product = {
        'id': new_id,
        'nome': nome,
        'preco': preco,
        'imagem': new_filename
    }
    products.append(new_product)
    
    with open(path, 'w') as f:
        json.dump(products, f, indent=2)
    
    return jsonify({'status': 'Produto adicionado com sucesso!', 'filename': new_filename})

@app.route('/login', methods=['POST'])
def login_api():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'success': False, 'error': 'Missing credentials'}), 400
    
    username = data['username']
    password = data['password']
    
    try:
        with open('logins.json', 'r') as f:
            logins = json.load(f)
    except FileNotFoundError:
        return jsonify({'success': False, 'error': 'Logins not found'}), 500
    
    for login in logins:
        if login['username'] == username:
            # Verify hash: SHA256(password) base64
            hash_input = hashlib.sha256(password.encode()).digest()
            hash_b64 = base64.b64encode(hash_input).decode()
            if login['hash'] == hash_b64:
                # Simple token: base64(username + timestamp)
                token = base64.b64encode(f"{username}:{int(os.times()[4]*1000)}".encode()).decode()
                return jsonify({'success': True, 'user': username, 'admin': True, 'token': token})
            else:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    
    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/logins.json')
def logins_api():
    return send_from_directory('.', 'logins.json')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
