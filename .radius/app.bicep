extension radius

@description('The Radius environment ID. Injected by Radius.')
param environment string

@description('The Radius application resource.')
param application string

resource frontend 'Applications.Core/containers@2023-10-01-preview' = {
  name: 'frontend'
  properties: {
    application: application
    environment: environment
    container: {
      image: 'ghcr.io/nicolejms/todo-list-app-gh:latest'
      ports: {
        web: {
          containerPort: 3000
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

resource db 'Applications.Datastores/sqlDatabases@2023-10-01-preview' = {
  name: 'db'
  properties: {
    application: application
    environment: environment
  }
}