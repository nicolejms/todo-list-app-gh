extension radius

@description('The Radius environment ID. Injected by Radius.')
param environment string

@description('The Radius application resource. Injected by Radius.')
param application string

@description('Database admin password. Pass via: rad deploy -p dbPassword=...')
@secure()
param dbPassword string

resource dbCredentials 'Radius.Security/secrets@2025-08-01-preview' = {
  name: 'db-creds'
  properties: {
    application: application
    environment: environment
    data: {
      USERNAME: {
        value: 'mysqladmin'
      }
      PASSWORD: {
        value: dbPassword
      }
    }
  }
}

resource db 'Radius.Data/mySqlDatabases@2025-08-01-preview' = {
  name: 'db'
  properties: {
    application: application
    environment: environment
    secretName: dbCredentials.name
  }
}

resource frontend 'Radius.Compute/containers@2025-08-01-preview' = {
  name: 'frontend'
  properties: {
    application: application
    environment: environment
    containers: {
      frontend: {
        image: 'ghcr.io/nicolejms/todo-list-app-gh:latest'
        ports: {
          web: {
            containerPort: 3000
          }
        }
      }
    }
    connections: {
      database: {
        source: db.id
      }
    }
  }
}