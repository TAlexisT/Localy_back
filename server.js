require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(
  process.env.STRIPE_TEST_KEY
);
const cors = require("cors");
const app = express();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const os = require("os");
const path = require("path");
const fs = require("fs");

/**
 * ¡¡Puerto en el cual se ejecutará el server!!
 */
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const { admin, db } = require("./src/db/Configuraciones");
const Controlador_Usuario = require("./src/Controllers/Usuarios");


const controladorUsuario = new Controlador_Usuario();
const datosPendientes = new Map();

app.post("/api/restaurante/crear-sesion-pago", async (req, res) => {
  const datos = req.body;
  const { price_id } = datos;

  if (!price_id) {
    return res.status(400).send({ error: "Falta el price_id" });
  }

  try {
    const id = Date.now().toString();
    datosPendientes.set(id, datos);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/api/restaurante/pago-exitoso?id=${id}`,
      cancel_url: `http://localhost:3000/error.html`,
    });

    res.send({ url: session.url }); // Posibilidad de key inexistente pues no ha sido declarada en la instancia actual "session"
  } catch (err) {
    console.error("Error al crear sesión de Stripe:", err);
    res.status(500).send({ error: "No se pudo iniciar el pago." });
  }
});

app.get("/api/restaurante/pago-exitoso", async (req, res) => {
  const id = req.query.id;
  const datos = datosPendientes.get(id);

  if (!datos) {
    return res.redirect("/error.html");
  }

  try {
    const docRef = await db.collection("usuarios").add({
      ...datos,
      tipo: "negocio",
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });

    const restauranteRef = await db.collection("restaurantes").add({
      usuarioId: docRef.id,
      correo: datos.correo,
      telefono: datos.telefono,
      tamano: datos.price_id,
      creado: admin.firestore.Timestamp.now(),
    });

    datosPendientes.delete(id);

    return res.redirect(`/perfil.html?restauranteId=${restauranteRef.id}`);
  } catch (err) {
    console.error("Error al guardar datos después del pago:", err);
    return res.redirect("/error.html");
  }
});

app.post("/api/verificar-negocio", async (req, res) => {
  const { correo, usuario } = req.body;

  if (!correo || !usuario) {
    return res.status(400).json({ error: "Correo y usuario requeridos" });
  }

  try {
    const ref = db.collection("usuarios");

    const [correoSnap, usuarioSnap] = await Promise.all([
      ref.where("correo", "==", correo).limit(1).get(),
      ref.where("usuario", "==", usuario).limit(1).get(),
    ]);

    return res.json({
      correoExiste: !correoSnap.empty,
      usuarioExiste: !usuarioSnap.empty,
    });
  } catch (error) {
    console.error("Error al verificar usuario/correo:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/api/registro", controladorUsuario.registro);

app.post("/api/login", controladorUsuario.login);

app.post("/api/restaurante/:id/perfil", async (req, res) => {
  const restauranteId = req.params.id;
  const datos = req.body;

  if (!restauranteId) {
    return res
      .status(400)
      .json({ error: "ID de restaurante no proporcionado." });
  }

  try {
    const docRef = db.collection("restaurantes").doc(restauranteId);
    await docRef.update({
      ...datos,
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "Perfil guardado correctamente" });
  } catch (err) {
    console.error("Error al guardar perfil:", err);
    res.status(500).json({ error: "Error al guardar el perfil" });
  }
});

app.get("/api/restaurante/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection("restaurantes").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Restaurante no encontrado" });
    }

    res.json(doc.data());
  } catch (err) {
    console.error("Error al obtener restaurante:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Actualizar perfil
app.put("/api/restaurante/perfil/:id", async (req, res) => {
  const { id } = req.params;
  const datos = req.body;

  /**
   * Brecha de seguridad:
   *    *Los datos no han sido validados al momento de ser introducidos dentro del storage*
   */

  try {
    await db.collection("restaurantes").doc(id).update(datos);
    res.json({ message: "Actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar:", err);
    res.status(500).json({ error: "No se pudo actualizar" });
  }
});

app.get("/api/restaurante/mostrar");

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
