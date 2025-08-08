# LIVELY® Back-End

## ¿Qué hace el proyecto?
Este proyecto es el "Back-end" de la aplicación tanto web como móvil de LIVELY®. 
El proyecto funcionará como el servidor, en donde se ejecutarán las operaciones correspondientes a los usuarios así como la gestión de los restaurantes y cuál sea la entidad relacionada. Dentro del servidor se podrán ejecutar tanta operación básicas de CRUD, por sus siglas en Inglés (Create, Read, Update, and Delete), como operaciones más complejas, por ejemplo, la ejecución de pagos y membresías de clientes y restaurantes.

## ¿Por qué el proyecto es útil?
Este proyecto provee una solución simple y modular para el desarrollo de la aplicación, pues permite ampliar, actualizar, mejorar y en general mantener el proyecto a largo plazo. Adicionalmente, la arquitectura cliente-servidor, la cual se está utilizando en este proyecto, provee mejor manejo y flexibilidad en el desarrollo.

## ¿Cómo puedes comenzar con el proyecto?
Para poder ejecutar este proyecto solo necesitas algunos sencillos pasos:
### Requerimientos
`git`, `Node.js`

### Pasos a seguir
> Clonar el pryecto en el directorio deseado:
```
git clone <url del repositorio>
```

> Una vez estando dentro del proyecto, inicializar el proyecto:
```
npm init
```

> Descarga las dependencias necesarias:
```
npm install
```
> o en todo caso
```
npm i
```

> Final mente, puedes ejecutar el proyecto con el comando:
```
npm start
```


## Como interactuar
Antes de poder interactuar con el API debemos tener en cuenta que existen multiples metodos correspondientes a los "end-point" (URLs) los cuales son "POST", "GET", "PUT", "DELETE" entre varios otros, sin embargo los más comunes son los antes mencionados. Estos metodos pertenecen a HTTP/HTTPS para entablar una comunicación por lo tanto cada interacción con el api se hará bajo ese criterio.
***
La explicación de todos los "End-Points" no ha sido completada. Además de los que han sido mostrados aquí, hay varios más, los cuales serán añadidos próximamente.
***

### End-Points tipo GET
#### Restaurantes:
**Obtener un restaurante por id**
```
/api/restaurante/perfil/<id>
```
El parametro 'id' representa el identificador unico del restaurante `ej. As23sA...`
```
Respuesta:
{
    "descripcion": String,
    "correo": String,
    "facebook": Boolean,
    "instagram": Boolean,
    "tiktok": Boolean,
    "whatsapp": Boolean,
    "telefono": String,
    "logo": Map,
    "nombre": String,
    "usuarioId": String
}
```

**Mostrar restaurantes en paginación**
```
/api/restaurante/mostrar
/api/restaurante/mostrar?pageSize=5&startAfter=As23sA...
```
Este end-point responde con los restaurantes de forma paginada. Para poder interactuar con la paginación se necesita introducir "query/es" en la URL `ej. pageSize=5`, `ej. startAfter=As23sA...`.
```
Respuesta:
{
    "datos": [                      // Lista de restaurantes seleccionados
        {
            "descripcion": String,
            "correo": String,
            "facebook": Boolean,
            "instagram": Boolean,
            "tiktok": Boolean,
            "whatsapp": Boolean,
            "telefono": String,
            "logo": Map,
            "nombre": String,
            "usuarioId": String
        },
        ...
    ],
    "ultimoToken": String            // Id del último restaurante seleccionado
}
```
### End-Points tipo POST
#### Usuarios:
**Registrar usuario**
```
/api/usuario/registro
```
Este end-point se utiliza para registrar un nuevo usuario y necesita algunos parámetros, los cuales son obligatorios
```
body:
{
    "usuario": String,
    "contrasena": String,
    "correo": String,
    "tipo": String
}
```
Si la petición es aceptada, entonces la API responderá con un status 201 (Created), en el caso contrario, responderá con un status 400 (Bad Request)
```
Status: 201,
{
    message: "Usuario registrado correctamente",
    usuarioId: String,                              // Id del usuario recién creado
}
```
En caso de no hacer una petición adecuada:
```
Status: 400,
{
    error: "Todos los campos son requeridos" || "El correo ya está registrado." || "El nombre de usuario ya existe."
}
```
**Login Usuario**
```
/api/usuario/login
```
Este end-point puede ocurrir varias alternativas en caso de no ejecutar una petición apropiada, pues en el caso de que falte alguno de los campos necesarios, este responderá con un status 400 (Bad Request), o en caso de que sean erróneas las claves Status 401 (Unauthorized). Finalmente, si todos los datos son introducidos correctamente, responderá con un status 202 (Accepted).
```
Status: 202,
{
    "id": String,
    "usuario": String,
    "correo": String,
    "tipo": String,
    "restauranteId": String,
}
```
En caso de una petición errónea
```
Status: 400,
{
    "error": "Correo y contraseña requeridos"
}
||
Status 401,
{
    "error": "Credenciales inválidas"
}
```
