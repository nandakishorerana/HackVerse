import { Query } from 'mongoose';
interface QueryString {
    [key: string]: any;
    sort?: string;
    fields?: string;
    page?: string;
    limit?: string;
}
declare class APIFeatures<T> {
    query: Query<T[], T>;
    queryString: QueryString;
    constructor(query: Query<T[], T>, queryString: QueryString);
    filter(): this;
    sort(): this;
    limitFields(): this;
    paginate(): this;
}
export { APIFeatures };
export default APIFeatures;
