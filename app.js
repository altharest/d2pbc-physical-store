const express = require("express");
const Database = require("better-sqlite3");
const winston = require("winston");
const axios = require("axios");
const db = new Database("./lojas.db");
const app = express();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

const distLojas = [];
const coordPush = [];
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

app.get("/:cep", async (req, res) => {
  logger.info("Requisiçao GET /");
  try {
    const resTeste = /^\d{8}$/;
    if (resTeste.test(req.params.cep)) {
      let url = `https://brasilapi.com.br/api/cep/v2/${req.params.cep}`;
      axios
        .get(url)
        .then((response) => {
          const coordTerm = response.data.location.coordinates;
          logger.info("Coordenadas do CEP digitado: " + coordTerm);
          if (Object.keys(coordTerm).length !== 0) {
            const coordLojas = coordPush.sort((a, b) => a.id - b.id);
            for (let coords of coordLojas) {
              let dist = calcDistancia(coordTerm, coords.coord);
              if (dist > 100) {
                logger.info(`Loja ID: ${coords.id} mais distante que 100 km`);
              } else {
                distLojas.push({ id: coords.id, distancia: dist });
              }
            }
          } else {
            logger.error("A API não possui as coordenadas para este CEP");
            res.status(500).json({
              message: "A API não possui as coordenadas para este CEP",
            });
          }
        })
        .then(() => {
          logger.info(distLojas.sort((a, b) => a.id - b.id));
          if (distLojas.length === 0) {
            console.log("\n**  NENHUMA LOJA MAIS PRÓXIMA QUE 100 KM  **");
            logger.info("Nenhuma loja mais próxima que 100 km");
          } else {
            console.log(
              "\n**  LISTA DAS LOJAS MAIS PRÓXIMAS DENTRO DE 100 KM  **"
            );
            for (let loja of distLojas.sort(
              (a, b) => a.distancia - b.distancia
            )) {
              if (loja.distancia <= 100) {
                console.log(
                  `\n${
                    lojasDb[loja.id - 1].nome
                  } | Distância: ${loja.distancia.toFixed(2)} km`
                );
                console.log(lojasDb[`${loja.id - 1}`]);
                logger.info(lojasDb[`${loja.id - 1}`]);
              }
            }
          }
        })
        .then(() => {
          res
            .status(200)
            .send(distLojas.sort((a, b) => a.distancia - b.distancia));
        });
    } else {
      logger.error(
        "CEP inválido: O valor digitado deve ter 8 dígitos e conter apenas números"
      );
      res.status(500).json({
        message:
          "CEP inválido: O valor digitado deve ter 8 dígitos e conter apenas números",
      });
    }
  } catch (error) {
    logger.error("Erro:", error.message);
    res.status(500).json({ message: "Erro ao buscar endereço" });
  }
});

const server = app.listen(3000, () => {
  logger.info("Servidor iniciado na porta 3000");
});
