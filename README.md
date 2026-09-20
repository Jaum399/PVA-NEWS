# PVA NEWS

Portal de notícias de Primavera do Leste com área editorial protegida em `/admin`.

## Publicar na Vercel

1. Importe o repositório `Jaum399/PVA-NEWS` na Vercel.
2. Configure as variáveis de ambiente do projeto:
	- `MONGODB_URI`: URI completa do Atlas, incluindo a senha do usuário `jmsfagundes_db_user`.
	- `MONGODB_DB`: nome do banco, por exemplo `pva_news`.
	- `ADMIN_TOKEN`: token longo e secreto usado pelo dono em `/admin`.
3. Faça o deploy. O painel ficará disponível em `https://pva-news.vercel.app/admin` se esse for o domínio atribuído ao projeto.

## MongoDB Atlas

O usuário do banco precisa ter acesso de leitura e escrita ao banco escolhido, e o IP da Vercel precisa ser permitido na configuração de Network Access do Atlas. A aplicação reutiliza o `MongoClient` entre invocações quentes e usa um pool pequeno, adequado ao uso editorial serverless.

## Conteúdo

O painel cria, edita, publica e exclui documentos na coleção `articles`. Apenas documentos com `published: true` são exibidos no front-end público. Imagens são armazenadas como URLs externas; não envie senhas, tokens ou arquivos `.env` ao GitHub.
