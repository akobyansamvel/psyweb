from collections import defaultdict
from datetime import datetime
import json


def analyze_user_patterns(test_results):
    """
    Анализирует паттерны пользователя на основе всех результатов тестов
    """
    patterns = {
        'trait_evolution': {},
        'inconsistencies': [],
        'correlations': [],
        'trends': {},
        'confidence_patterns': {},
        'response_time_patterns': {}
    }
    
    if not test_results:
        return patterns
    
    # Анализируем эволюцию черт личности
    trait_history = defaultdict(list)
    for result in test_results:
        scores = result.score if isinstance(result.score, dict) else {}
        for trait, score in scores.items():
            trait_history[trait].append({
                'test_id': result.test.id,
                'test_name': result.test.name,
                'score': score,
                'date': result.completed_at.isoformat(),
                'confidence': result.confidence_levels.get(str(trait), 0),
                'response_time': result.response_time.get(str(trait), 0)
            })
    
    # Анализируем тренды и несоответствия
    for trait, history in trait_history.items():
        if len(history) > 1:
            scores = [h['score'] for h in history]
            avg_score = sum(scores) / len(scores)
            variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
            
            # Определяем тренд
            if len(scores) >= 2:
                trend = 'increasing' if scores[-1] > scores[0] else 'decreasing' if scores[-1] < scores[0] else 'stable'
            else:
                trend = 'stable'
            
            patterns['trait_evolution'][trait] = {
                'history': history,
                'average_score': round(avg_score, 2),
                'variance': round(variance, 2),
                'trend': trend,
                'consistency': 'high' if variance < 100 else 'medium' if variance < 200 else 'low'
            }
            
            # Выявляем несоответствия
            if variance > 150:  # Высокая вариативность
                patterns['inconsistencies'].append({
                    'trait': trait,
                    'type': 'high_variance',
                    'description': f'Высокая вариативность в черте "{trait}" (дисперсия: {round(variance, 2)})',
                    'scores': scores,
                    'tests': [h['test_name'] for h in history]
                })
    
    # Анализируем корреляции между чертами
    all_traits = set()
    for result in test_results:
        scores = result.score if isinstance(result.score, dict) else {}
        all_traits.update(scores.keys())
    
    trait_scores_by_test = defaultdict(dict)
    for result in test_results:
        scores = result.score if isinstance(result.score, dict) else {}
        for trait, score in scores.items():
            trait_scores_by_test[result.test.id][trait] = score
    
    # Находим корреляции
    trait_list = list(all_traits)
    for i, trait1 in enumerate(trait_list):
        for trait2 in trait_list[i+1:]:
            correlation = calculate_correlation(trait_scores_by_test, trait1, trait2)
            if abs(correlation) > 0.3:  # Значимая корреляция
                patterns['correlations'].append({
                    'trait1': trait1,
                    'trait2': trait2,
                    'correlation': round(correlation, 3),
                    'strength': 'strong' if abs(correlation) > 0.7 else 'medium' if abs(correlation) > 0.5 else 'weak'
                })
    
    # Анализируем паттерны уверенности
    confidence_by_trait = defaultdict(list)
    for result in test_results:
        for trait, confidence in result.confidence_levels.items():
            confidence_by_trait[trait].append(confidence)
    
    for trait, confidences in confidence_by_trait.items():
        if confidences:
            avg_confidence = sum(confidences) / len(confidences)
            patterns['confidence_patterns'][trait] = {
                'average': round(avg_confidence, 2),
                'trend': 'increasing' if len(confidences) > 1 and confidences[-1] > confidences[0] else 'stable'
            }
    
    return patterns


def calculate_correlation(trait_scores_by_test, trait1, trait2):
    """
    Вычисляет корреляцию между двумя чертами личности
    """
    scores1 = []
    scores2 = []
    
    for test_id, scores in trait_scores_by_test.items():
        if trait1 in scores and trait2 in scores:
            scores1.append(scores[trait1])
            scores2.append(scores[trait2])
    
    if len(scores1) < 2:
        return 0
    
    # Вычисляем корреляцию Пирсона
    n = len(scores1)
    sum1 = sum(scores1)
    sum2 = sum(scores2)
    sum1_sq = sum(x * x for x in scores1)
    sum2_sq = sum(x * x for x in scores2)
    p_sum = sum(scores1[i] * scores2[i] for i in range(n))
    
    num = p_sum - (sum1 * sum2 / n)
    den = ((sum1_sq - sum1 * sum1 / n) * (sum2_sq - sum2 * sum2 / n)) ** 0.5
    
    if den == 0:
        return 0
    
    return num / den


def generate_dynamic_personality_map(test_results, patterns):
    """
    Генерирует динамическую карту личности на основе всех результатов тестов
    """
    if not test_results:
        return {
            'traits': {},
            'connections': [],
            'inconsistencies': [],
            'patterns': patterns,
            'overall_score': 0,
            'last_updated': datetime.now().isoformat()
        }
    
    # Объединяем все черты личности
    all_traits = {}
    trait_counts = defaultdict(int)
    
    for result in test_results:
        scores = result.score if isinstance(result.score, dict) else {}
        for trait, score in scores.items():
            if trait not in all_traits:
                all_traits[trait] = []
            all_traits[trait].append(score)
            trait_counts[trait] += 1
    
    # Вычисляем средние значения и стабильность
    dynamic_traits = {}
    for trait, scores in all_traits.items():
        avg_score = sum(scores) / len(scores)
        variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
        
        # Определяем стабильность
        if variance < 100:
            stability = 'high'
        elif variance < 200:
            stability = 'medium'
        else:
            stability = 'low'
        
        # Определяем уровень развития
        if avg_score >= 80:
            level = "Очень высокий"
        elif avg_score >= 60:
            level = "Высокий"
        elif avg_score >= 40:
            level = "Средний"
        elif avg_score >= 20:
            level = "Низкий"
        else:
            level = "Очень низкий"
        
        dynamic_traits[trait] = {
            'score': round(avg_score, 2),
            'level': level,
            'stability': stability,
            'variance': round(variance, 2),
            'test_count': trait_counts[trait],
            'description': get_trait_description(trait, avg_score),
            'recommendations': get_trait_recommendations(trait, avg_score, stability),
            'evolution': patterns.get('trait_evolution', {}).get(trait, {})
        }
    
    # Создаем связи между чертами
    connections = []
    inconsistencies = []
    
    # Добавляем корреляции как связи
    for correlation in patterns.get('correlations', []):
        trait1 = correlation['trait1']
        trait2 = correlation['trait2']
        
        if trait1 in dynamic_traits and trait2 in dynamic_traits:
            connections.append({
                'from': trait1,
                'to': trait2,
                'strength': abs(correlation['correlation']) * 100,
                'type': 'correlation',
                'correlation': correlation['correlation'],
                'description': f"Корреляция: {correlation['strength']}"
            })
    
    # Добавляем несоответствия
    for inconsistency in patterns.get('inconsistencies', []):
        inconsistencies.append({
            'trait': inconsistency['trait'],
            'type': inconsistency['type'],
            'description': inconsistency['description'],
            'severity': 'high' if 'high_variance' in inconsistency['type'] else 'medium'
        })
    
    # Вычисляем общий балл
    if dynamic_traits:
        overall_score = sum(trait['score'] for trait in dynamic_traits.values()) / len(dynamic_traits)
    else:
        overall_score = 0
    
    return {
        'traits': dynamic_traits,
        'connections': connections,
        'inconsistencies': inconsistencies,
        'patterns': patterns,
        'overall_score': round(overall_score, 2),
        'last_updated': datetime.now().isoformat(),
        'total_tests': len(test_results),
        'unique_traits': len(dynamic_traits)
    }


def get_trait_description(trait, score):
    """Возвращает описание черты личности"""
    descriptions = {
        'Экстраверсия': 'Способность получать энергию от внешнего мира и взаимодействия с людьми',
        'Интроверсия': 'Способность получать энергию от внутреннего мира и размышлений',
        'Открытость': 'Готовность к новому опыту и творческому мышлению',
        'Добросовестность': 'Самодисциплина, организованность и целеустремленность',
        'Доброжелательность': 'Сотрудничество, доверие и альтруизм',
        'Нейротизм': 'Эмоциональная стабильность и устойчивость к стрессу',
        'Креативность': 'Способность к нестандартному мышлению и творчеству',
        'Лидерство': 'Способность влиять на других и принимать решения',
        'Эмпатия': 'Способность понимать чувства и эмоции других людей',
        'Адаптивность': 'Гибкость в изменяющихся условиях'
    }
    return descriptions.get(trait, f'Черта личности: {trait}')


def get_trait_recommendations(trait, score, stability):
    """Возвращает рекомендации по развитию черты личности"""
    base_recommendations = {
        'high': f"У вас отлично развита черта '{trait}'. Продолжайте развивать её и используйте для достижения целей.",
        'medium': f"Черта '{trait}' развита хорошо. Работайте над её укреплением для лучших результатов.",
        'low': f"Черта '{trait}' развита на среднем уровне. Регулярная практика поможет улучшить её.",
        'very_low': f"Черта '{trait}' требует развития. Начните с небольших шагов и постепенно увеличивайте нагрузку.",
        'critical': f"Черта '{trait}' нуждается в активном развитии. Рассмотрите возможность работы с коучем или психологом."
    }
    
    if score >= 80:
        level = 'high'
    elif score >= 60:
        level = 'medium'
    elif score >= 40:
        level = 'low'
    elif score >= 20:
        level = 'very_low'
    else:
        level = 'critical'
    
    recommendation = base_recommendations[level]
    
    # Добавляем рекомендации по стабильности
    if stability == 'low':
        recommendation += f" Обратите внимание на нестабильность результатов по этой черте - это может указывать на внутренние противоречия или изменения в вашей жизни."
    elif stability == 'medium':
        recommendation += f" Результаты по этой черте показывают умеренную стабильность - продолжайте наблюдать за изменениями."
    
    return recommendation
