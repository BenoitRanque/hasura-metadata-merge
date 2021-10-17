import { TypeNode, GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
export declare const unwrapType: (wrappedTypename: string) => {
    stack: string[];
    typename: string;
};
export declare const getAstTypeMetadata: (type: TypeNode) => {
    typename: string;
    stack: string[];
};
export declare const getSchemaTypeMetadata: (type: GraphQLObjectType | GraphQLInputObjectType) => {
    typename: string;
    stack: string[];
};
export declare const wrapTypename: (name: string, wrapperStack: string[]) => string;
