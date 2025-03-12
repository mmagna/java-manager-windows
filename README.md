# Java Version Manager

Una aplicación de escritorio para gestionar fácilmente múltiples versiones de Java en Windows.

## Características

- Detecta automáticamente instalaciones existentes de Java
- Instala nuevas versiones de OpenJDK y distribuciones alternativas
- Cambia entre versiones de Java con un solo clic
- Desinstala versiones que ya no necesitas
- Gestiona variables de entorno (JAVA_HOME, PATH) automáticamente

## Capturas de pantalla

![Captura de pantalla principal](screenshots/main.png)

## Instalación

### Opción 1: Instalador
1. Descarga el instalador desde la sección [Releases](https://github.com/tuusuario/java-manager/releases)
2. Ejecuta el archivo `.exe` o `.msi` descargado
3. Sigue las instrucciones del instalador

### Opción 2: Versión portable
1. Descarga el archivo ZIP desde la sección [Releases](https://github.com/tuusuario/java-manager/releases)
2. Extrae el contenido en cualquier ubicación de tu sistema
3. Ejecuta `java-version-manager.exe`

## Uso

1. Al iniciar la aplicación, verás las versiones de Java instaladas en tu sistema
2. Para instalar una nueva versión, selecciónala del menú desplegable y haz clic en "Instalar"
3. Para activar una versión, selecciónala y haz clic en "Activar"
4. Para desinstalar una versión, haz clic en "Desinstalar"

## Desarrollo

### Requisitos previos
- Node.js 18 o superior
- npm o yarn

### Configuración del entorno de desarrollo
```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/java-manager.git
cd java-manager

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run electron:dev