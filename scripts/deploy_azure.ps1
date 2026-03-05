<#
.SYNOPSIS
    Script de Despliegue en Azure (Doc4 Infraestructura MedIA)
.DESCRIPTION
    Reúne todos los comandos de Azure CLI definidos en el Doc4
    para desplegar MedIA en producción.
    NOTA: Esto es un script de referencia. ¡Requiere que configures
    las variables y hagas 'az login' antes de ejecutarlo!
#>

$RESOURCE_GROUP="media-ece-rg"
$LOCATION="eastus"

# 1. Login y Grupo de Recursos
Write-Host "Asegúrate de haber ejecutado 'az login'" -ForegroundColor Yellow
# az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Azure Database for PostgreSQL Flexible Server
# az postgres flexible-server create --location $LOCATION --resource-group $RESOURCE_GROUP --name media-db-server --admin-user dbadmin --admin-password <TUPASSWORD> --sku-name Standard_B1ms --tier Burstable --public-access 0.0.0.0 --version 15

# 3. Azure App Service (Backend)
# az appservice plan create --name media-app-plan --resource-group $RESOURCE_GROUP --sku B1 --is-linux
# az webapp create --resource-group $RESOURCE_GROUP --plan media-app-plan --name media-api-backend --runtime "PYTHON|3.11"

# 4. Azure Static Web Apps (Frontend)
# az staticwebapp create --name media-frontend --resource-group $RESOURCE_GROUP --source https://github.com/<USUARIO>/<REPO> --location $LOCATION --branch main --app-location "/frontend" --output-location "dist" --login-with-github

# 5. Azure Blob Storage
# az storage account create --name mediaeceblob --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS
# az storage container create --account-name mediaeceblob --name lab-results
# az storage container create --account-name mediaeceblob --name tutores-docs

Write-Host "Revisa este script despacio y ejecuta cada bloque en tu entorno de Azure." -ForegroundColor Green
