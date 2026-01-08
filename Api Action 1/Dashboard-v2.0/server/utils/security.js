// 🔒 Middleware de Segurança e Validação
// Utilitários para proteção da API

/**
 * Sanitizar string para uso seguro em RegExp
 * Previne ataques ReDoS (Regular Expression Denial of Service)
 */
export function sanitizeRegex(input) {
    if (typeof input !== 'string') {
        throw new Error('Input deve ser uma string');
    }
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validar status de dispositivo
 */
export function validateStatus(status) {
    const validStatuses = ['online', 'offline', 'connected', 'disconnected'];
    const normalized = String(status).toLowerCase().trim();
    
    if (!validStatuses.includes(normalized)) {
        throw new Error(`Status inválido: ${status}. Valores permitidos: ${validStatuses.join(', ')}`);
    }
    
    return normalized;
}

/**
 * Validar e limitar tamanho de string
 */
export function validateStringLength(str, maxLength = 255, fieldName = 'campo') {
    if (typeof str !== 'string') {
        throw new Error(`${fieldName} deve ser uma string`);
    }
    
    if (str.length > maxLength) {
        throw new Error(`${fieldName} excede o tamanho máximo de ${maxLength} caracteres`);
    }
    
    return str.trim();
}

/**
 * Sanitizar objetos removendo campos perigosos
 */
export function sanitizeObject(obj) {
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    const cleaned = {};
    
    for (const key in obj) {
        if (!dangerous.includes(key)) {
            cleaned[key] = obj[key];
        }
    }
    
    return cleaned;
}

/**
 * Rate limiting manual para endpoints específicos
 */
const requestCounts = new Map();

export function checkRateLimit(identifier, limit = 100, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = `${identifier}-${Math.floor(now / windowMs)}`;
    
    const count = requestCounts.get(key) || 0;
    
    if (count >= limit) {
        return {
            allowed: false,
            retryAfter: Math.ceil((windowMs - (now % windowMs)) / 1000)
        };
    }
    
    requestCounts.set(key, count + 1);
    
    // Limpar entradas antigas
    if (requestCounts.size > 1000) {
        const oldKeys = Array.from(requestCounts.keys()).slice(0, -500);
        oldKeys.forEach(k => requestCounts.delete(k));
    }
    
    return { allowed: true };
}

/**
 * Validar formato de email
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Escapar caracteres HTML para prevenir XSS
 */
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

export default {
    sanitizeRegex,
    validateStatus,
    validateStringLength,
    sanitizeObject,
    checkRateLimit,
    validateEmail,
    escapeHtml
};
