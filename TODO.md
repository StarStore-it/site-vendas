# TODO - Fix Product Image Rename and Display

- [x] Step 1: Create TODO.md (done)
- [x] Step 2: Edit server.py to add `/add-product` endpoint: handle FormData with image, nome, preco; rename image to `imagem_{nome_clean}.{ext}`; append product to products.json.
- [x] Step 3: Edit script.js: 
  - Update `addProduct()` to send FormData(nome, preco, image) to `/add-product`.
  - Fix `loadProducts()` rendering: conditional img tag with onerror fallback to no-image div.
- [x] Step 4: Update TODO.md with completion status.
- [ ] Step 5: Test - python server.py, login admin 'adimin', toggle add product, fill nome/preco/image, salvar, verify images/ 'imagem_nome.ext', image shows in products (not "Sem Imagem").

