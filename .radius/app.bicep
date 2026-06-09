extension radius

@description('The Radius environment to deploy into')
param environment string

@description('The Radius application')
param application string

// Todo List App - Node.js Express frontend with PostgreSQL backend
resource todoApp 'Applications.Core/containers@2023-10-01-preview' = {
  name: 'todo-app'
  properties: {
    application: application
    container: {
      image: 'todo-app:latest'
      ports: {
        http: {
          containerPort: 3000
          protocol: 'TCP'
        }
      }
      env: {
        POSTGRES_HOST: {
          value: postgresDb.properties.host
        }
        POSTGRES_USER: {
          value: 'postgres'
        }
        POSTGRES_PASSWORD: {
          value: postgresDb.listSecrets().password
        }
        POSTGRES_DB: {
          value: postgresDb.properties.database
        }
      }
    }
    connections: {
      postgres: {
        source: postgresDb.id
      }
    }
  }
}

resource postgresDb 'Applications.Datastores/sqlDatabases@2023-10-01-preview' = {
  name: 'todo-postgres'
  properties: {
    application: application
    environment: environment
    database: 'todos'
    server: 'postgres'
    port: 5432
  }
}

resource todoRoute 'Applications.Core/httpRoutes@2023-10-01-preview' = {
  name: 'todo-route'
  properties: {
    application: application
    port: 3000
  }
}

resource todoGateway 'Applications.Core/gateways@2023-10-01-preview' = {
  name: 'todo-gateway'
  properties: {
    application: application
    routes: {
      default: {
        path: '/'
        destination: todoRoute.id
      }
    }
  }
}
