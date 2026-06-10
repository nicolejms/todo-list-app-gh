extension radius

@description('The Radius environment ID.')
param environment string

@description('The Radius application resource.')
param application string

resource frontend 'Radius.Compute/containers@2025-08-01-preview' = {
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

resource db 'Radius.Data/sqlDatabases@2025-08-01-preview' = {
  name: 'db'
  properties: {
    application: application
    environment: environment
  }
}