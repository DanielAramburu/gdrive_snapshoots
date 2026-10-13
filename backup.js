import fs from "fs";
import path from "path";
import readline from "readline";
import { google } from "googleapis";
import { ZipArchive } from "archiver";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';

// Función para comprimir la carpeta usando ZipArchive (v8)
function comprimirCarpeta(rutaOrigen, rutaSalidaZip) {
    return new Promise((resolve, reject) => {
        console.log(`Comprimiendo la ruta '${rutaOrigen}'...`);
        const output = fs.createWriteStream(rutaSalidaZip);
        
        const archive = new ZipArchive({
            zlib: { level: 9 }, // Nivel máximo de compresión
        });

        output.on("close", function () {
            console.log(`${archive.pointer()} total bytes. Comprimido en: ${rutaSalidaZip}`);
            resolve();
        });

        output.on("end", function () {
            console.log("Data has been drained");
        });

        archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
                console.warn("Advertencia:", err);
            } else {
                reject(err);
            }
        });

        archive.on("error", function (err) {
            reject(err);
        });

        // Conectar el flujo de datos del archivo comprimido al archivo físico de salida
        archive.pipe(output);

        // Añadir el contenido de la carpeta de forma recursiva en la raíz del ZIP
        archive.directory(rutaOrigen, false);

        // Finalizar el archivo ZIP
        archive.finalize();
    });
}

// Función para autorizar en Google Drive
async function autorizarDrive() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client;
    } else {
        return await obtenerNuevoToken(oAuth2Client);
    }
}

// Obtener nuevo token por consola si no existe
function obtenerNuevoToken(oAuth2Client) {
    return new Promise((resolve, reject) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Autoriza esta aplicación visitando esta URL:\n', authUrl);
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        
        rl.question('Introduce el código de autorización aquí: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return reject('Error al recuperar el token de acceso: ' + err);
                oAuth2Client.setCredentials(token);
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                console.log('Token almacenado correctamente en', TOKEN_PATH);
                resolve(oAuth2Client);
            });
        });
    });
}

// Función principal de copia de seguridad
async function realizarCopiaSeguridad() {
    const rutaLocal = process.env.BACKUP_ROUTE;
    const prefijoNombre = process.env.BACKUP_PREFIX;

    if (!rutaLocal) {
        console.error("¡Error! La variable BACKUP_ROUTE no está definida en el archivo .env");
        process.exit(1);
    }

    // 1. Generar nombre único basado en fecha y hora
    const now = new Date();
    const fechaActualStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const nombreZip = `${prefijoNombre}${fechaActualStr}.zip`;

    // 2. Comprimir ruta local usando ZipArchive
    await comprimirCarpeta(rutaLocal, nombreZip);

    // 3. Conectar a Google Drive
    console.log('Conectando con Google Drive...');
    const auth = await autorizarDrive();
    const drive = google.drive({ version: 'v3', auth });

    // 4. Subir el nuevo archivo ZIP
    console.log('Subiendo copia de seguridad a Google Drive...');
    const fileMetadata = { name: nombreZip };
    const media = {
        mimeType: 'application/zip',
        body: fs.createReadStream(nombreZip),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });
    console.log('¡Copia subida con éxito! ID del archivo:', response.data.id);

    // Eliminar el archivo ZIP temporal local
    fs.unlinkSync(nombreZip);

    // 5. Borrar copias de seguridad de hace más de 30 días
    console.log('Buscando copias de seguridad anteriores a 30 días para eliminar...');
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const fechaLimiteStr = hace30Dias.toISOString();

    const query = `name contains '${prefijoNombre}' and createdTime < '${fechaLimiteStr}' and trashed = false`;
    const listResponse = await drive.files.list({
        q: query,
        spaces: 'drive',
        fields: 'files(id, name, createdTime)',
    });

    const files = listResponse.data.files;
    if (!files || files.length === 0) {
        console.log('No se encontraron copias de seguridad antiguas para borrar.');
    } else {
        for (const file of files) {
            console.log(`Eliminando copia antigua: ${file.name} (Creada el: ${file.createdTime})`);
            await drive.files.delete({ fileId: file.id });
        }
        console.log('Limpieza de archivos antiguos finalizada.');
    }
}

// Ejecutar el proceso
realizarCopiaSeguridad()
    .then(() => console.log('Proceso de respaldo completado con éxito.'))
    .catch((err) => console.error('Ocurrió un error:', err));