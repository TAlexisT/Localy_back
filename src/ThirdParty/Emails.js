class Emails {
  verificacionEmail(usuario, URL) {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Verifica tu correo - Localy MX</title>
            <style>
            body {
                margin: 0;
                padding: 0;
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                color: #374151;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                padding: 30px 20px;
                text-align: center;
            }
            .logo {
                color: white;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 20px;
                margin-bottom: 20px;
                color: #1f2937;
            }
            .message {
                margin-bottom: 30px;
                color: #4b5563;
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
                transition: all 0.3s ease;
            }
            .verify-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 8px rgba(16, 185, 129, 0.3);
            }
            .footer {
                padding: 20px 30px;
                background-color: #f8fafc;
                text-align: center;
                font-size: 14px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
            }
            .disclaimer {
                font-size: 13px;
                color: #9ca3af;
                margin-top: 20px;
            }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo">Localy MX</h1>
                </div>
                <div class="content">
                    <p class="greeting">Hola${usuario ? " " + usuario : ""},</p>
                    <p class="message">
                        Gracias por registrarte en Localy MX. Para comenzar a disfrutar de
                        todos nuestros servicios, necesitamos que verifiques tu dirección de
                        correo electrónico.
                    </p>
                    <p class="message">
                        Haz clic en el siguiente botón para completar la verificación:
                    </p>

                    <div class="button-container">
                        <a href="${URL}" class="verify-button"> Verificar mi correo </a>
                    </div>
                </div>
                <div class="footer">
                    <p>
                        Este es un mensaje automático, por favor no respondas a este correo.
                    </p>
                    <p class="disclaimer">
                        Si no solicitaste crear una cuenta en Localy MX, puedes ignorar este
                        mensaje.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
  }
}

module.exports = Emails;
