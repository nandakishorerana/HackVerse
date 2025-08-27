export declare const swaggerOptions: {
    definition: {
        openapi: string;
        info: {
            title: string;
            version: string;
            description: string;
            contact: {
                name: string;
                email: string;
            };
            license: {
                name: string;
                url: string;
            };
        };
        servers: {
            url: string;
            description: string;
        }[];
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: string;
                    scheme: string;
                    bearerFormat: string;
                    description: string;
                };
            };
            schemas: {
                User: {
                    type: string;
                    required: string[];
                    properties: {
                        _id: {
                            type: string;
                            description: string;
                        };
                        name: {
                            type: string;
                            description: string;
                        };
                        email: {
                            type: string;
                            format: string;
                            description: string;
                        };
                        phone: {
                            type: string;
                            description: string;
                        };
                        role: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        address: {
                            type: string;
                            properties: {
                                street: {
                                    type: string;
                                };
                                city: {
                                    type: string;
                                };
                                state: {
                                    type: string;
                                };
                                pincode: {
                                    type: string;
                                };
                                coordinates: {
                                    type: string;
                                    properties: {
                                        latitude: {
                                            type: string;
                                        };
                                        longitude: {
                                            type: string;
                                        };
                                    };
                                };
                            };
                        };
                        isActive: {
                            type: string;
                            description: string;
                        };
                        createdAt: {
                            type: string;
                            format: string;
                        };
                        updatedAt: {
                            type: string;
                            format: string;
                        };
                    };
                };
                ServiceProvider: {
                    type: string;
                    required: string[];
                    properties: {
                        _id: {
                            type: string;
                            description: string;
                        };
                        user: {
                            type: string;
                            description: string;
                        };
                        services: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                        };
                        experience: {
                            type: string;
                            description: string;
                        };
                        hourlyRate: {
                            type: string;
                            description: string;
                        };
                        availability: {
                            type: string;
                            description: string;
                        };
                        rating: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            description: string;
                        };
                        totalReviews: {
                            type: string;
                            description: string;
                        };
                        isVerified: {
                            type: string;
                            description: string;
                        };
                    };
                };
                Service: {
                    type: string;
                    required: string[];
                    properties: {
                        _id: {
                            type: string;
                            description: string;
                        };
                        name: {
                            type: string;
                            description: string;
                        };
                        category: {
                            type: string;
                            description: string;
                        };
                        description: {
                            type: string;
                            description: string;
                        };
                        basePrice: {
                            type: string;
                            description: string;
                        };
                        duration: {
                            type: string;
                            description: string;
                        };
                        isActive: {
                            type: string;
                            description: string;
                        };
                    };
                };
                Booking: {
                    type: string;
                    required: string[];
                    properties: {
                        _id: {
                            type: string;
                            description: string;
                        };
                        customer: {
                            type: string;
                            description: string;
                        };
                        provider: {
                            type: string;
                            description: string;
                        };
                        service: {
                            type: string;
                            description: string;
                        };
                        scheduledDate: {
                            type: string;
                            format: string;
                            description: string;
                        };
                        address: {
                            type: string;
                            properties: {
                                street: {
                                    type: string;
                                };
                                city: {
                                    type: string;
                                };
                                state: {
                                    type: string;
                                };
                                pincode: {
                                    type: string;
                                };
                            };
                        };
                        status: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        totalAmount: {
                            type: string;
                            description: string;
                        };
                        paymentStatus: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                    };
                };
                Review: {
                    type: string;
                    required: string[];
                    properties: {
                        _id: {
                            type: string;
                            description: string;
                        };
                        booking: {
                            type: string;
                            description: string;
                        };
                        customer: {
                            type: string;
                            description: string;
                        };
                        provider: {
                            type: string;
                            description: string;
                        };
                        rating: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            description: string;
                        };
                        comment: {
                            type: string;
                            description: string;
                        };
                        createdAt: {
                            type: string;
                            format: string;
                        };
                    };
                };
                Error: {
                    type: string;
                    properties: {
                        success: {
                            type: string;
                            example: boolean;
                        };
                        message: {
                            type: string;
                            description: string;
                        };
                        errors: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    field: {
                                        type: string;
                                    };
                                    message: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                Success: {
                    type: string;
                    properties: {
                        success: {
                            type: string;
                            example: boolean;
                        };
                        message: {
                            type: string;
                            description: string;
                        };
                        data: {
                            type: string;
                            description: string;
                        };
                    };
                };
            };
        };
        security: {
            bearerAuth: any[];
        }[];
        tags: {
            name: string;
            description: string;
        }[];
    };
    apis: string[];
};
export default swaggerOptions;
