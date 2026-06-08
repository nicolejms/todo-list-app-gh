extension radius

param application string
param environment string

resource app 'Applications.Core/applications@2023-10-01-preview' = {
  name: 'todo-list-app'
  properties: {
    environment: environment
  }
}

resource webApp 'Applications.Core/containers@2023-10-01-preview' = {
  name: 'web-app'
  properties: {
    application: application
    container: {
      image: 'node:22-alpine'
      ports: {
        http: {
          containerPort: 3000
          protocol: 'TCP'
        }
      }
      env: {
        PG_HOST: {
          value: postgresDb.properties.host
        }
        PG_USER: {
          value: postgresDb.properties.username
        }
        PG_PASSWORD: {
          value: postgresDb.listSecrets().password
        }
        PG_DB: {
          value: postgresDb.properties.database
        }
      }
    }
    connections: {
      POSTGRES: {
        source: postgresDb.id
      }
    }
  }
}

resource postgresDb 'Applications.Datastores/sqlDatabases@2023-10-01-preview' = {
  name: 'postgres-db'
  properties: {
    application: application
    environment: environment
    database: 'todos'
  }
}
