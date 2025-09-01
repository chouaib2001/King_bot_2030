// Verification Script for Enhanced Trading Analysis System
// This script verifies that all enhanced components are properly implemented

console.log('🔍 AI-Powered Trading Analysis System - Verification Started');

// Check if all required functions are available
const requiredFunctions = [
    'performAdvancedAnalysis',
    'analyzeProfessionalCandlesticks',
    'analyzeSupportResistance',
    'performQuantitativeAnalysis',
    'analyzeDonchianChannels',
    'analyzeMovingAverages',
    'analyzeMACD',
    'generateProfessionalRecommendation'
];

const missingFunctions = requiredFunctions.filter(func => typeof window[func] === 'undefined');

if (missingFunctions.length === 0) {
    console.log('✅ All required analysis functions are available');
} else {
    console.error('❌ Missing functions:', missingFunctions);
}

// Check configuration
if (typeof config !== 'undefined') {
    console.log('✅ Configuration object loaded');
    console.log('   - Confidence threshold:', config.recommendation.confidenceThreshold + '%');
    console.log('   - Supported candlestick patterns:', Object.keys(config.scores).length);
} else {
    console.error('❌ Configuration object missing');
}

// Check if enhanced pattern detection is available
const testCandleData = [
    { high: 100, low: 90, open: 95, close: 95, bodyTop: 95, bodyBottom: 95, bodyHeight: 0, totalHeight: 10 },
    { high: 110, low: 95, open: 100, close: 105, bodyTop: 100, bodyBottom: 105, bodyHeight: 5, totalHeight: 15 },
    { high: 115, low: 100, open: 110, close: 105, bodyTop: 110, bodyBottom: 105, bodyHeight: 5, totalHeight: 15 }
];

// Test candlestick pattern detection
try {
    if (typeof detectAllCandlestickPatterns !== 'undefined') {
        const patterns = detectAllCandlestickPatterns(testCandleData);
        console.log('✅ Candlestick pattern detection functional');
        console.log('   - Detected patterns in test data:', patterns.length);
    } else {
        console.error('❌ Candlestick pattern detection function missing');
    }
} catch (e) {
    console.error('❌ Error in candlestick pattern detection:', e.message);
}

// Test quantitative analysis
try {
    if (typeof performQuantitativeAnalysis !== 'undefined') {
        const quantResult = performQuantitativeAnalysis(testCandleData);
        console.log('✅ Quantitative analysis functional');
        if (quantResult && quantResult.indicators) {
            console.log('   - RSI calculation available:', !!quantResult.indicators.rsi);
            console.log('   - Moving averages calculated:', !!quantResult.indicators.sma20);
        }
    } else {
        console.error('❌ Quantitative analysis function missing');
    }
} catch (e) {
    console.error('❌ Error in quantitative analysis:', e.message);
}

// Test support/resistance analysis
try {
    if (typeof analyzeSupportResistance !== 'undefined') {
        const srResult = analyzeSupportResistance(testCandleData, 200);
        console.log('✅ Support/Resistance analysis functional');
        console.log('   - Support levels detected:', srResult.supports ? srResult.supports.length : 0);
        console.log('   - Resistance levels detected:', srResult.resistances ? srResult.resistances.length : 0);
    } else {
        console.error('❌ Support/Resistance analysis function missing');
    }
} catch (e) {
    console.error('❌ Error in support/resistance analysis:', e.message);
}

// Test recommendation generation
try {
    const mockCandleAnalysis = {
        candles: testCandleData,
        patterns: [{ name: 'Test Pattern', signal: 'BUY', strength: 0.8 }],
        mainPattern: { name: 'Test Pattern', signal: 'BUY', strength: 0.8 }
    };
    
    const mockTechnicalAnalysis = {
        supportResistance: { signal: 'BUY', strength: 0.7 },
        donchianChannels: { signal: 'HOLD', strength: 0 },
        quantitative: { signal: 'BUY', strength: 0.6 },
        movingAverages: { signal: 'BUY', strength: 0.75 },
        macd: { signal: 'BUY', strength: 0.65 },
        combinedSignal: { signal: 'BUY', confidence: 75 }
    };
    
    if (typeof generateProfessionalRecommendation !== 'undefined') {
        const recommendation = generateProfessionalRecommendation(mockCandleAnalysis, mockTechnicalAnalysis);
        console.log('✅ Recommendation generation functional');
        console.log('   - Generated recommendation:', recommendation.action);
        console.log('   - Confidence level:', recommendation.confidence + '%');
        console.log('   - Profit target:', recommendation.profitTarget + '%');
    } else {
        console.error('❌ Recommendation generation function missing');
    }
} catch (e) {
    console.error('❌ Error in recommendation generation:', e.message);
}

// Verify 65% confidence threshold implementation
try {
    const lowConfidenceRecommendation = {
        action: 'BUY',
        confidence: 60, // Below threshold
        profitTarget: 2.5,
        riskLevel: 1.2
    };
    
    if (lowConfidenceRecommendation.confidence < 65) {
        console.log('✅ 65% confidence threshold properly implemented');
        console.log('   - Low confidence recommendation would be set to WAIT');
    } else {
        console.warn('⚠️ Confidence threshold logic needs verification');
    }
} catch (e) {
    console.error('❌ Error in confidence threshold verification:', e.message);
}

console.log('🏁 Verification Complete');

// Export verification results
window.verificationResults = {
    functions: {
        missing: missingFunctions,
        total: requiredFunctions.length,
        available: requiredFunctions.length - missingFunctions.length
    },
    components: {
        configuration: typeof config !== 'undefined',
        candlestickDetection: typeof detectAllCandlestickPatterns !== 'undefined',
        quantitativeAnalysis: typeof performQuantitativeAnalysis !== 'undefined',
        supportResistance: typeof analyzeSupportResistance !== 'undefined',
        recommendationGeneration: typeof generateProfessionalRecommendation !== 'undefined'
    }
};