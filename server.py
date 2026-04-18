from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
@app.route('/index.html')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

@app.route('/products.json', methods=['GET', 'POST'])
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

@app.route('/logins.json')
def logins_api():
    return send_from_directory('.', 'logins.json')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
