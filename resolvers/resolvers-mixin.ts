import type { Constructor } from 'lit-element';
import type { ApolloElement } from '@apollo-elements/mixins/apollo-element';
import type { Resolvers } from 'apollo-client';
import type { CustomElement } from '../lib/constructor';

import { dedupeMixin } from '@open-wc/dedupe-mixin';

type Base = Constructor<ApolloElement<unknown> & CustomElement>

export const ResolversMixin = dedupeMixin(
  // It's better to let typescript infer this type
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function ResolversMixinImpl<TBase extends Base>(superclass: TBase) {
    /**
     * Provides an easy way to lazy-load Apollo Client 2.x resolvers
     *
     * @element ResolversMixin
     *
     * @example
     * ```js
     * import * as AppResolvers from './resolvers';
     *
     * class QueryElement extends ApolloQuery {
     *   resolvers: AppResolvers;
     * }
     * ```
     */
    class ResolversElement extends superclass {
      /**
       * Resolvers for the component
       */
      resolvers?: Resolvers;

      connectedCallback(): void {
        super.connectedCallback?.();
        if (this.resolvers)
          this.client.addResolvers(this.resolvers);
      }
    };

    return ResolversElement;
  }
);
