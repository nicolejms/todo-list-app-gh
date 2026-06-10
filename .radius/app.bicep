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
      cache: {
        source: redis.id
      }
    }
    runtimes: {
      kubernetes: {
        pod: {
          imagePullSecrets: [
            {
              name: 'ghcr-pull-secret'
            }
          ]
        }
      }
    }
  }
}

resource redis 'Applications.Datastores/redisCaches@2023-10-01-preview' = {
  name: 'redis'
  properties: {
    application: application
    environment: environment
  }
}

resource db 'Applications.Datastores/sqlDatabases@2023-10-01-preview' = {
  name: 'db'
  properties: {
    application: application
    environment: environment
  }
}