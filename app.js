const express = require("express");
const axios = require("axios");
const app = express();

app.get("/cep/:cep", async (req, res) => {
  const cep = req.params.cep;
  const url = `https://viacep.com.br/ws/${cep}/json/`;
  try {
    const response = await axios.get(url);
    const endereco = response.data;
    console.log(endereco);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Erro ao buscar endereço" });
  }
});

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
});
