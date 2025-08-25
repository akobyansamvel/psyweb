from django.urls import path
from . import views

urlpatterns = [
    # Тесты
    path('tests/', views.TestListView.as_view(), name='test-list'),
    path('tests/<int:pk>/', views.TestDetailView.as_view(), name='test-detail'),
    path('tests/<int:test_id>/submit/', views.TestSubmissionView.as_view(), name='test-submit'),
    
    # Результаты
    path('results/<int:pk>/', views.TestResultView.as_view(), name='result-detail'),
    path('users/history/', views.UserHistoryView.as_view(), name='user-history'),
    
    # Аутентификация
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('users/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('users/dynamic-profile/', views.UserDynamicProfileView.as_view(), name='user-dynamic-profile'),
    
    # PsyToolkit API
    path('psytoolkit/tests/', views.PsyToolkitViewSet.as_view(), name='psytoolkit-tests'),
    path('psytoolkit/search/', views.search_psytoolkit_tests, name='psytoolkit-search'),
    path('psytoolkit/tests/<str:test_id>/details/', views.get_psytoolkit_test_details, name='psytoolkit-test-details'),
    path('psytoolkit/import/', views.import_psytoolkit_test, name='psytoolkit-import'),
    path('psytoolkit/sync/', views.sync_psytoolkit_tests, name='psytoolkit-sync'),
    path('psytoolkit/logs/', views.get_psytoolkit_import_logs, name='psytoolkit-logs'),
    path('psytoolkit/categories/', views.get_available_psytoolkit_categories, name='psytoolkit-categories'),
    path('psytoolkit/statistics/', views.get_psytoolkit_test_statistics, name='psytoolkit-statistics'),
]
