interface SearchQuery {
    query?: string;
    category?: string;
    location?: {
        city?: string;
        state?: string;
        coordinates?: [number, number];
        radius?: number;
    };
    priceRange?: {
        min?: number;
        max?: number;
    };
    rating?: number;
    availability?: {
        date?: Date;
        timeSlots?: string[];
    };
    verified?: boolean;
    sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity' | 'distance' | 'newest';
    page?: number;
    limit?: number;
}
interface SearchFilters {
    duration?: {
        min?: number;
        max?: number;
    };
    serviceType?: 'individual' | 'team';
    experience?: number;
    certifications?: string[];
    languages?: string[];
}
declare class SearchService {
    searchServices(searchQuery: SearchQuery, filters?: SearchFilters): Promise<{
        services: any[];
        total: number;
        page: number;
        totalPages: number;
        filters: any;
    }>;
    searchProviders(searchQuery: SearchQuery): Promise<{
        providers: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getRecommendations(userId: string, options: {
        type: 'popular' | 'nearby' | 'similar' | 'trending';
        limit?: number;
        location?: {
            city: string;
            coordinates?: [number, number];
        };
    }): Promise<any[]>;
    getAvailableFilters(searchQuery: SearchQuery): Promise<{
        categories: string[];
        priceRanges: {
            min: number;
            max: number;
        }[];
        locations: {
            city: string;
            count: number;
        }[];
        ratings: number[];
    }>;
    getSearchSuggestions(query: string, limit?: number): Promise<{
        services: string[];
        categories: string[];
        providers: string[];
    }>;
    trackSearch(userId: string | null, query: string, filters: any, results: number): Promise<void>;
    getPopularSearches(limit?: number): Promise<string[]>;
}
export { SearchService };
declare const _default: SearchService;
export default _default;
