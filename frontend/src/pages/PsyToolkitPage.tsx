import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../types';

interface PsyToolkitTest {
  id: number;
  name: string;
  description: string;
  psy_toolkit_id: string;
  author: string;
  category: string;
  tags: string[];
  is_imported: boolean;
  created_at: string;
}

interface PsyToolkitCategory {
  id: string;
  name: string;
  description: string;
}

interface PsyToolkitStatistics {
  total_tests: number;
  imported_tests: number;
  available_tests: number;
  import_rate: number;
  category_stats: Record<string, { total: number; imported: number }>;
  recent_imports: Array<{
    test_name: string;
    import_date: string;
    imported_by: string;
  }>;
}

const PsyToolkitPage: React.FC = () => {
  const { token } = useAuth();
  const [tests, setTests] = useState<PsyToolkitTest[]>([]);
  const [categories, setCategories] = useState<PsyToolkitCategory[]>([]);
  const [statistics, setStatistics] = useState<PsyToolkitStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    fetchTests();
    fetchCategories();
    fetchStatistics();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/psytoolkit/tests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Проверяем, что data - это массив
        if (Array.isArray(data)) {
          setTests(data);
        } else if (data.results && Array.isArray(data.results)) {
          setTests(data.results);
        } else {
          console.error('Неожиданный формат данных:', data);
          setTests([]);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке тестов:', error);
      setTests([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/psytoolkit/categories/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
      setCategories([]);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/psytoolkit/statistics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchTests = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('limit', '20');

      const response = await fetch(`${API_BASE_URL}/psytoolkit/search/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.tests)) {
          setTests(data.tests);
        }
      }
    } catch (error) {
      console.error('Ошибка при поиске тестов:', error);
    }
  };

  const syncTests = async () => {
    setSyncStatus('Синхронизация...');
    try {
      const response = await fetch(`${API_BASE_URL}/psytoolkit/sync/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: selectedCategory ? [selectedCategory] : ['personality', 'cognitive', 'clinical', 'neuropsychological']
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(`Синхронизировано ${data.synced_count} тестов`);
        fetchTests(); // Обновляем список тестов
        fetchStatistics(); // Обновляем статистику
      }
    } catch (error) {
      console.error('Ошибка при синхронизации:', error);
      setSyncStatus('Ошибка при синхронизации');
    }
  };

  const importTest = async (testId: string) => {
    setImportStatus('Импорт...');
    try {
      const response = await fetch(`${API_BASE_URL}/psytoolkit/import/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test_id: testId }),
      });
      if (response.ok) {
        const data = await response.json();
        setImportStatus(data.message);
        fetchTests(); // Обновляем список тестов
        fetchStatistics(); // Обновляем статистику
      }
    } catch (error) {
      console.error('Ошибка при импорте:', error);
      setImportStatus('Ошибка при импорте');
    }
  };

  // Безопасная фильтрация тестов
  const filteredTests = Array.isArray(tests) ? tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка PsyToolkit тестов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PsyToolkit Тесты</h1>
          <p className="text-lg text-gray-600">
            Импортируйте и управляйте психологическими тестами из базы PsyToolkit
          </p>
        </div>

        {/* Статистика */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900">Всего тестов</h3>
              <p className="text-3xl font-bold text-indigo-600">{statistics.total_tests}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900">Импортировано</h3>
              <p className="text-3xl font-bold text-green-600">{statistics.imported_tests}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900">Доступно</h3>
              <p className="text-3xl font-bold text-blue-600">{statistics.available_tests}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900">Процент импорта</h3>
              <p className="text-3xl font-bold text-purple-600">{statistics.import_rate}%</p>
            </div>
          </div>
        )}

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Поиск тестов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Все категории</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={searchTests}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Поиск
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={syncTests}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Синхронизировать
            </button>
            {syncStatus && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
                {syncStatus}
              </span>
            )}
          </div>
        </div>

        {/* Список тестов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map(test => (
            <div key={test.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  test.is_imported 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {test.is_imported ? 'Импортирован' : 'Доступен'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {test.description}
              </p>
              
              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="font-medium">Автор:</span>
                  <span className="ml-2">{test.author || 'Не указан'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="font-medium">Категория:</span>
                  <span className="ml-2">{test.category}</span>
                </div>
                {test.tags && test.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {test.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {test.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{test.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {!test.is_imported && (
                <button
                  onClick={() => importTest(test.psy_toolkit_id)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Импортировать
                </button>
              )}
              
              {test.is_imported && (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                >
                  Уже импортирован
                </button>
              )}
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Тесты не найдены</p>
            <p className="text-gray-400">Попробуйте изменить параметры поиска или синхронизировать тесты</p>
          </div>
        )}

        {/* Статус импорта */}
        {importStatus && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default PsyToolkitPage;
