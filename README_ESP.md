# Copia de Seguridad Automatizada en Google Drive

Una aplicación ligera y robusta en Node.js diseñada para comprimir automáticamente un directorio local, subir el archivo `.zip` resultante a Google Drive y eliminar aquellas copias de seguridad que tengan más de 30 días de antigüedad.

## Características

* **Compresión local**: Utiliza la librería `archiver` (v8) con el nivel máximo de compresión (`ZipArchive`) para empaquetar tu directorio objetivo.
* **Integración con Google Drive**: Se autentica automáticamente mediante OAuth2 y sube la copia de seguridad.
* **Limpieza automática**: Consulta Google Drive para buscar copias de seguridad anteriores que coincidan con tu prefijo y elimina las que superen los 30 días.
* **Configuración mediante variables de entorno**: Permite configurar fácilmente las rutas locales y prefijos utilizando un archivo `.env`.

## Requisitos previos

* [Node.js](https://nodejs.org/) (se recomienda v16 o superior).
* Una cuenta de Google Cloud con acceso habilitado a la API de Google Drive.

## Instrucciones de configuración

### 1. Configuración del proyecto
Asegúrate de que todos los archivos del proyecto estén en tu directorio de trabajo y que tu `package.json` incluya `"type": "module"` para admitir módulos ES.

### 2. Instalar dependencias
Ejecuta el siguiente comando en la raíz de tu proyecto para instalar los paquetes necesarios (`googleapis`, `archiver` y `dotenv`):

```bash
npm install
```

### 3. Configurar las credenciales de Google Drive
1. Entra en la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Crea un nuevo proyecto (o selecciona uno existente) y habilita la **API de Google Drive**.
3. Ve a **APIs y servicios > Credenciales** y haz clic en **Crear credenciales > ID de cliente de OAuth**.
4. Selecciona **Aplicación de escritorio** (Desktop application) como tipo de aplicación.
5. Descarga el archivo JSON de credenciales, cámbiale el nombre a `credentials.json` y colócalo en la carpeta raíz de tu proyecto.

### 4. Crear el archivo `.env`
Crea un archivo llamado `.env` en el directorio raíz de tu proyecto y configura la ruta de tu carpeta y el prefijo de las copias:

```env
BACKUP_ROUTE=./mi_carpeta_a_respaldar
BACKUP_PREFIX=backup_
```

## Uso

Ejecuta el script utilizando Node.js:

```bash
node backup.js
```

### Primera Autenticación:
1. La primera vez que ejecutes el script, este te pedirá que autorices la aplicación o te proporcionará una URL en la consola.
2. Abre dicha URL en tu navegador web, inicia sesión con tu cuenta de Google y concede los permisos necesarios.
3. Una vez autorizado, el script generará automáticamente un archivo `token.json`, por lo que no necesitarás volver a autenticarte en ejecuciones posteriores.