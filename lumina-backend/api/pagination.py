"""Custom pagination classes for Lumina API.

This module provides specialized pagination classes for different types of API responses.
All pagination classes extend Django REST Framework's PageNumberPagination and provide
consistent response formatting with additional metadata.

Response Format:
    All paginated responses follow this structure:
    {
        "pagination": {
            "count": <total_items>,
            "next": <next_page_url>,
            "previous": <previous_page_url>,
            "current_page": <current_page_number>,
            "total_pages": <total_page_count>,
            "page_size": <items_per_page>
        },
        "results": [<data_items>]
    }

Pagination Classes:
    - StandardResultsSetPagination: 20 items per page, max 100 (default for most views)
    - LargeResultsSetPagination: 50 items per page, max 200 (for task lists)
    - SmallResultsSetPagination: 10 items per page, max 50 (for comments)

Query Parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (within max_page_size limit)
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination class for most list views.
    
    Used for projects, labels, and other medium-sized datasets.
    Provides 20 items per page by default with user-configurable page size.
    
    Attributes:
        page_size (int): Default number of items per page (20)
        page_size_query_param (str): Query parameter name for custom page size
        max_page_size (int): Maximum allowed page size (100)
    """
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """Return paginated response with additional metadata.
        
        Enhances the standard pagination response with extra metadata
        for better frontend pagination handling.
        
        Args:
            data (list): The serialized data for the current page
            
        Returns:
            Response: DRF Response object with pagination metadata and results
        """
        return Response({
            'pagination': {
                'count': self.page.paginator.count,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'page_size': self.page_size,
            },
            'results': data
        })


class LargeResultsSetPagination(PageNumberPagination):
    """Pagination for views that might return many items.
    
    Used for task lists and other potentially large datasets that benefit
    from larger page sizes to reduce API calls while maintaining performance.
    
    Attributes:
        page_size (int): Default number of items per page (50)
        page_size_query_param (str): Query parameter name for custom page size
        max_page_size (int): Maximum allowed page size (200)
    """
    
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
    
    def get_paginated_response(self, data):
        """Return paginated response with additional metadata.
        
        Enhances the standard pagination response with extra metadata
        for better frontend pagination handling.
        
        Args:
            data (list): The serialized data for the current page
            
        Returns:
            Response: DRF Response object with pagination metadata and results
        """
        return Response({
            'pagination': {
                'count': self.page.paginator.count,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'page_size': self.page_size,
            },
            'results': data
        })


class SmallResultsSetPagination(PageNumberPagination):
    """Pagination for views with fewer items like comments.
    
    Used for comments and other small datasets where users typically
    want to see fewer items per page for better readability.
    
    Attributes:
        page_size (int): Default number of items per page (10)
        page_size_query_param (str): Query parameter name for custom page size
        max_page_size (int): Maximum allowed page size (50)
    """
    
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50
    
    def get_paginated_response(self, data):
        """Return paginated response with additional metadata.
        
        Enhances the standard pagination response with extra metadata
        for better frontend pagination handling.
        
        Args:
            data (list): The serialized data for the current page
            
        Returns:
            Response: DRF Response object with pagination metadata and results
        """
        return Response({
            'pagination': {
                'count': self.page.paginator.count,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'page_size': self.page_size,
            },
            'results': data
        })