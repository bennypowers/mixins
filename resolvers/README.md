# ResolversMixin

Provides an easy way to lazy-load Apollo Client 2.x resolvers

## Example

```js
import * as AppResolvers from './resolvers';

class QueryElement extends ApolloQuery {
  resolvers: AppResolvers;
}
```


# ResolversMixin

Provides an easy way to lazy-load Apollo Client 2.x resolvers

## Example

```js
import * as AppResolvers from './resolvers';

class QueryElement extends ApolloQuery {
  resolvers: AppResolvers;
}
```

## Properties

| Property    | Type                     | Description                 |
|-------------|--------------------------|-----------------------------|
| `resolvers` | `Resolvers \| undefined` | Resolvers for the component |
