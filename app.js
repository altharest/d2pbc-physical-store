const express = require("express");
const Database = require("better-sqlite3");
const axios = require("axios");
const readline = require("readline");
const app = express();
const db = new Database("./lojas.db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let distLojas = [];
let coordPush = [];
const lojasDb = db.prepare("SELECT * FROM lojas").all();
for (let loja of lojasDb) {
  axios
    .get(`https://brasilapi.com.br/api/cep/v2/${loja.cep}`)
    .then((response) => {
      coordPush.push({
        id: loja.id,
        coord: response.data.location.coordinates,
      });
    });
}

function calcDistancia(coord1, coord2) {
  const lat1 = coord1.latitude;
  const lon1 = coord1.longitude;
  const lat2 = coord2.latitude;
  const lon2 = coord2.longitude;
  const raioTerra = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1Rad) *
      Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = raioTerra * c;
  return distancia;
}

app.get("/", async (req, res) => {
  try {
    console.log("APP.GET");
    rl.question("** DIGITE O CEP (apenas números) ** ", (resposta) => {
      let url = `https://brasilapi.com.br/api/cep/v2/${resposta}`;
      rl.close();
      axios
        .get(url)
        .then((response) => {
          const coordTerm = response.data.location.coordinates;
          const coordLojas = coordPush.sort((a, b) => a.id - b.id);
          for (let coords of coordLojas) {
            let dist = calcDistancia(coordTerm, coords.coord);
            distLojas.push({ id: coords.id, distancia: dist });
          }
        })
        .then(() => {
          res
            .status(200)
            .send(distLojas.sort((a, b) => a.distancia - b.distancia));
        });
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Erro ao buscar endereço" });
  }
});

axios
  .get("http://localhost:3000/")
  .then((response) => {
    console.log("**  LISTA DAS LOJAS MAIS PRÓXIMAS DENTRO DE 100 KM  **");
    for (let loja of response.data) {
      if (loja.distancia <= 100) {
        console.log("*");
        console.log(
          `${lojasDb[loja.id - 1].nome} | Distância: ${loja.distancia.toFixed(
            2
          )} km`
        );
        console.log(lojasDb[`${loja.id - 1}`]);
        console.log("*");
      }
    }
    server.close(() => process.exit(0));
  })
  .catch((error) => {
    console.log(error.message);
  });

const server = app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000");
});
