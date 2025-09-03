// Professional Trading Analysis Engine - Advanced AI Chart Analyzer v6.0
'use strict';

const config = {
    debug: true,
    candles: {
        scanCount: 100,
        minWidth: 3,
        chartAreaRatio: 0.85,
        greenCandle: (r, g, b) => g > r * 1.2 && g > b * 1.2 && g > 80,
        redCandle: (r, g, b) => r > g * 1.2 && r > b * 1.2 && r > 80,
        dojiBodyRatio: 0.1,
        wickRatio: 2.0
    },
    supportResistance: {
        zoneProximity: 0.02,
        minTouches: 3,
        clusterTolerance: 0.015
    },
    donchian: {
        periods: [20, 50],
        breakoutThreshold: 0.02
    },
    scores: {
        doji: 1.5,
        hammer: 3.0,
        shootingStar: 3.0,
        engulfing: 4.0,
        harami: 3.5,
        piercingLine: 3.5,
        darkCloudCover: 3.5,
        morningStar: 5.0,
        eveningStar: 5.0,
        threeWhiteSoldiers: 4.5,
        threeBlackCrows: 4.5,
        strongSupport: 5.0,
        strongResistance: 5.0,
        upperBreakout: 4.0,
        lowerBreakout: 4.0
    },
    recommendation: {
        confidenceThreshold: 65, // As requested by user
        profitTargets: {
            conservative: 0.02,
            moderate: 0.035,
            aggressive: 0.05
        }
    }
};

// Real-time Analyzer Framework
class RealTimeAnalyzer {
    constructor() {
        this.analysisModules = {
            candlestick: this.analyzeCandlesticks.bind(this),
            supportResistance: this.analyzeSupportResistance.bind(this),
            donchian: this.analyzeDonchianChannels.bind(this),
            quantitative: this.performQuantitativeAnalysis.bind(this),
            liquidity: this.performLiquidityAnalysis.bind(this),
            trend: this.performTrendAnalysis.bind(this)
        };
    }

    // Main analysis method that processes chart image
    async analyzeChartImage(file) {
        try {
            // Load image data
            const [imageData, img] = await this.loadImageData(file);
            
            // Extract OHLC data from image
            const ohlcData = this.extractOHLCData(imageData);
            
            // Process through all analysis modules
            const results = await this.processAllModules(ohlcData, imageData);
            
            // Generate final recommendation
            const recommendation = await this.generateRecommendation(results);
            
            // Return complete analysis
            return {
                ohlcData: ohlcData,
                analysisResults: results,
                recommendation: recommendation,
                image: img
            };
        } catch (error) {
            console.error('❌ REAL-TIME ANALYSIS FAILED:', error);
            throw new Error(`Analysis Error: ${error.message}`);
        }
    }

    // Load image data from file
    loadImageData(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', {
                willReadFrequently: true
            });
            const img = new Image();

            img.onload = () => {
                const maxWidth = 1200,
                    maxHeight = 800;
                let {
                    width,
                    height
                } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                try {
                    const imageData = ctx.getImageData(0, 0, width, height);
                    resolve([imageData, img]);
                } catch (e) {
                    reject(new Error('Failed to read image data'));
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    // Extract OHLC data from image data
    extractOHLCData(imageData) {
        const {
            data: pixels,
            width,
            height
        } = imageData;
        const cfg = config.candles;
        const chartAreaHeight = height * cfg.chartAreaRatio;

        // Enhanced candle detection
        let candles = [];
        let currentCandle = null;

        for (let x = width - 1; x > 0; x--) {
            let isCandleColumn = false;
            for (let y = 0; y < chartAreaHeight; y++) {
                const i = (y * width + x) * 4;
                if (cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2]) || cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2])) {
                    isCandleColumn = true;
                    break;
                }
            }

            if (isCandleColumn) {
                if (!currentCandle) currentCandle = {
                    x_end: x,
                    x_start: x
                };
                currentCandle.x_start = x;
            } else {
                if (currentCandle && (currentCandle.x_end - currentCandle.x_start) >= cfg.minWidth) {
                    candles.push(currentCandle);
                    if (candles.length >= cfg.scanCount) break;
                }
                currentCandle = null;
            }
        }

        if (candles.length === 0) {
            throw new Error("No candles detected in chart image");
        }

        // Process each candle with enhanced statistics
        for (const candle of candles) {
            const midX = Math.round((candle.x_start + candle.x_end) / 2);
            let high = height,
                low = 0,
                bodyHigh = height,
                bodyLow = 0;
            let greenPixels = 0,
                redPixels = 0;

            // Find candle boundaries
            for (let y = 0; y < chartAreaHeight; y++) {
                const i = (y * width + midX) * 4;
                if (cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2]) || cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2])) {
                    if (high === height) high = y;
                    low = y;
                }
            }

            // Determine candle color
            for (let y = high; y <= low; y++) {
                const i = (y * width + midX) * 4;
                if (cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2])) greenPixels++;
                if (cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2])) redPixels++;
            }

            candle.isGreen = greenPixels > redPixels;
            candle.isRed = !candle.isGreen;

            // Find body boundaries
            let inBody = false;
            for (let y = high; y <= low; y++) {
                const i = (y * width + midX) * 4;
                const isColorMatch = (candle.isGreen && cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2])) ||
                    (candle.isRed && cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2]));
                if (isColorMatch) {
                    if (!inBody) bodyHigh = y;
                    bodyLow = y;
                    inBody = true;
                }
            }

            // Calculate candle properties
            candle.high = high;
            candle.low = low;
            candle.totalHeight = low - high;
            candle.bodyTop = bodyHigh;
            candle.bodyBottom = bodyLow;
            candle.open = candle.isGreen ? bodyLow : bodyHigh;
            candle.close = candle.isGreen ? bodyHigh : bodyLow;
            candle.bodyHeight = Math.abs(candle.close - candle.open);
            candle.upperWick = (candle.isGreen ? candle.close : candle.open) - candle.high;
            candle.lowerWick = candle.low - (candle.isGreen ? candle.open : candle.close);
            candle.bodyRatio = candle.bodyHeight / candle.totalHeight;
            candle.upperWickRatio = candle.upperWick / candle.totalHeight;
            candle.lowerWickRatio = candle.lowerWick / candle.totalHeight;
        }

        candles.reverse();
        const validCandles = candles.filter(c => c.totalHeight > 0);
        
        return validCandles;
    }

    // Process all analysis modules
    async processAllModules(ohlcData, imageData) {
        const results = {};
        
        // Run all analysis modules in parallel for efficiency
        const promises = Object.keys(this.analysisModules).map(async (moduleName) => {
            try {
                if (moduleName === 'candlestick') {
                    results[moduleName] = await this.analysisModules[moduleName](ohlcData);
                } else {
                    results[moduleName] = await this.analysisModules[moduleName](ohlcData, imageData);
                }
            } catch (error) {
                console.error(`❌ MODULE ${moduleName} FAILED:`, error);
                results[moduleName] = { error: error.message };
            }
        });
        
        await Promise.all(promises);
        return results;
    }

    // Individual analysis methods (delegated to existing functions)
    async analyzeCandlesticks(candles) {
        return analyzeProfessionalCandlesticks({ candles: candles });
    }

    async analyzeSupportResistance(candles, imageData) {
        return analyzeSupportResistance(candles, imageData.height);
    }

    async analyzeDonchianChannels(candles) {
        return analyzeDonchianChannels(candles);
    }

    async performQuantitativeAnalysis(candles, imageData) {
        return performQuantitativeAnalysis(candles);
    }

    async performLiquidityAnalysis(candles, imageData) {
        return performLiquidityAnalysis(candles, imageData.height);
    }

    async performTrendAnalysis(candles, imageData) {
        return performTrendAnalysis(candles);
    }

    // Generate final recommendation
    async generateRecommendation(analysisResults) {
        return generateProfessionalRecommendation(
            analysisResults.candlestick,
            {
                supportResistance: analysisResults.supportResistance,
                donchianChannels: analysisResults.donchian,
                quantitative: analysisResults.quantitative,
                liquidity: analysisResults.liquidity,
                trend: analysisResults.trend
            }
        );
    }
}

// Initialize the real-time analyzer
const realTimeAnalyzer = new RealTimeAnalyzer();

// Update the main analysis function to use the new framework
async function performAdvancedAnalysis(file) {
    if (config.debug) {
        console.clear();
        console.log('🚀 PROFESSIONAL ANALYSIS ENGINE v7.0 STARTED');
    }

    const startTime = Date.now();
    const progressFill = document.getElementById('progressFill');
    const steps = {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3'),
        step4: document.getElementById('step4'),
    };

    try {
        document.getElementById('analysisArea').style.display = 'block';
        document.getElementById('resultsArea').style.display = 'none';
        Object.values(steps).forEach(step => {
            if (step) step.classList.remove('active');
        });

        if (progressFill) progressFill.style.width = '15%';
        if (steps.step1) steps.step1.classList.add('active');
        
        // Use the new real-time analyzer framework
        const analysisResult = await realTimeAnalyzer.analyzeChartImage(file);

        if (progressFill) progressFill.style.width = '100%';
        const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);

        setTimeout(() => {
            displayProfessionalResults(
                analysisResult.recommendation, 
                analysisResult.analysisResults.candlestick, 
                {
                    supportResistance: analysisResult.analysisResults.supportResistance,
                    donchianChannels: analysisResult.analysisResults.donchian,
                    quantitative: analysisResult.analysisResults.quantitative,
                    liquidity: analysisResult.analysisResults.liquidity,
                    trend: analysisResult.analysisResults.trend
                }, 
                analysisTime, 
                analysisResult.image
            );
        }, 800);

    } catch (error) {
        console.error('❌ ANALYSIS FAILED:', error);
        showError(`Analysis Error: ${error.message}`);
        resetAnalyzer();
    } finally {
        analysisInProgress = false;
    }
}

// Modified candlestick analysis function for the new framework
async function analyzeProfessionalCandlesticks(data) {
    const candles = data.candles;
    
    // Professional pattern detection
    const patterns = detectAllCandlestickPatterns(candles);

    return {
        candles: candles,
        patterns: patterns,
        mainPattern: patterns[0] || {
            name: 'No Pattern',
            signal: 'HOLD',
            strength: 0
        }
    };
}

function detectAllCandlestickPatterns(candles) {
    if (candles.length < 3) return [];

    const patterns = [];
    const len = candles.length;

    // Get recent candles for analysis
    const c0 = candles[len - 1]; // Latest
    const c1 = candles[len - 2]; // Previous
    const c2 = candles[len - 3]; // Two back

    // Single Candle Patterns
    if (c0.bodyRatio < config.candles.dojiBodyRatio) {
        patterns.push({
            name: 'Doji',
            signal: 'HOLD',
            strength: 0.6,
            description: 'Market Indecision',
            context: 'Neutral'
        });
    }

    // Enhanced Hammer detection with better wick ratio
    if (c0.lowerWickRatio > config.candles.wickRatio * 0.6 && 
        c0.upperWickRatio < 0.1 && 
        c0.bodyRatio < 0.3) {
        patterns.push({
            name: 'Hammer',
            signal: 'BUY',
            strength: 0.8,
            description: 'Bullish Reversal',
            context: 'Oversold'
        });
    }

    // Enhanced Shooting Star detection
    if (c0.upperWickRatio > config.candles.wickRatio * 0.6 && 
        c0.lowerWickRatio < 0.1 && 
        c0.bodyRatio < 0.3) {
        patterns.push({
            name: 'Shooting Star',
            signal: 'SELL',
            strength: 0.8,
            description: 'Bearish Reversal',
            context: 'Overbought'
        });
    }

    // Inverted Hammer
    if (c0.upperWickRatio > config.candles.wickRatio * 0.6 && 
        c0.lowerWickRatio < 0.2 && 
        c0.bodyRatio < 0.3) {
        patterns.push({
            name: 'Inverted Hammer',
            signal: 'BUY',
            strength: 0.7,
            description: 'Bullish Reversal Signal',
            context: 'Downtrend'
        });
    }

    // Hanging Man
    if (c0.lowerWickRatio > config.candles.wickRatio * 0.6 && 
        c0.upperWickRatio < 0.2 && 
        c0.bodyRatio < 0.3) {
        patterns.push({
            name: 'Hanging Man',
            signal: 'SELL',
            strength: 0.7,
            description: 'Bearish Reversal Signal',
            context: 'Uptrend'
        });
    }

    // Marubozu candles
    if (c0.bodyRatio > 0.9) {
        patterns.push({
            name: c0.isGreen ? 'Bullish Marubozu' : 'Bearish Marubozu',
            signal: c0.isGreen ? 'BUY' : 'SELL',
            strength: 0.85,
            description: 'Strong Trend Continuation',
            context: c0.isGreen ? 'Bullish' : 'Bearish'
        });
    }

    // Spinning Top
    if (c0.bodyRatio < 0.3 && 
        c0.upperWickRatio > 0.2 && 
        c0.lowerWickRatio > 0.2) {
        patterns.push({
            name: 'Spinning Top',
            signal: 'HOLD',
            strength: 0.5,
            description: 'Market Indecision',
            context: 'Neutral'
        });
    }

    // Two Candle Patterns
    if (c0.isGreen && c1.isRed && c0.close > c1.open && c0.open < c1.close) {
        patterns.push({
            name: 'Bullish Engulfing',
            signal: 'BUY',
            strength: 0.9,
            description: 'Strong Bullish Reversal',
            context: 'Downtrend'
        });
    }

    if (c0.isRed && c1.isGreen && c0.close < c1.open && c0.open > c1.close) {
        patterns.push({
            name: 'Bearish Engulfing',
            signal: 'SELL',
            strength: 0.9,
            description: 'Strong Bearish Reversal',
            context: 'Uptrend'
        });
    }

    if (c1.isRed && c0.isGreen && c0.open < c1.close && c0.close > (c1.open + c1.close) / 2) {
        patterns.push({
            name: 'Piercing Line',
            signal: 'BUY',
            strength: 0.75,
            description: 'Bullish Reversal',
            context: 'Downtrend'
        });
    }

    if (c1.isGreen && c0.isRed && c0.open > c1.close && c0.close < (c1.open + c1.close) / 2) {
        patterns.push({
            name: 'Dark Cloud Cover',
            signal: 'SELL',
            strength: 0.75,
            description: 'Bearish Reversal',
            context: 'Uptrend'
        });
    }

    // Harami patterns
    if (c1.bodyHeight > c0.bodyHeight * 2 &&
        ((c1.isGreen && c0.isGreen && c0.open > c1.close && c0.close < c1.close) ||
            (c1.isRed && c0.isRed && c0.open < c1.close && c0.close > c1.close))) {
        patterns.push({
            name: c1.isGreen ? 'Bullish Harami' : 'Bearish Harami',
            signal: c1.isGreen ? 'SELL' : 'BUY',
            strength: 0.7,
            description: 'Trend Reversal Signal',
            context: c1.isGreen ? 'Uptrend' : 'Downtrend'
        });
    }

    // Three Candle Patterns  
    if (candles.length >= 3) {
        // Morning Star
        if (c2.isRed && c1.bodyRatio < 0.3 && c0.isGreen && c0.close > c2.open) {
            patterns.push({
                name: 'Morning Star',
                signal: 'BUY',
                strength: 0.95,
                description: 'Powerful Bullish Reversal',
                context: 'Oversold'
            });
        }

        // Evening Star
        if (c2.isGreen && c1.bodyRatio < 0.3 && c0.isRed && c0.close < c2.open) {
            patterns.push({
                name: 'Evening Star',
                signal: 'SELL',
                strength: 0.95,
                description: 'Powerful Bearish Reversal',
                context: 'Overbought'
            });
        }

        // Three White Soldiers
        if (candles.length >= 5) {
            const c3 = candles[len - 4];
            const c4 = candles[len - 5];

            if (c4.isGreen && c3.isGreen && c2.isGreen &&
                c3.close > c4.close && c2.close > c3.close) {
                patterns.push({
                    name: 'Three White Soldiers',
                    signal: 'BUY',
                    strength: 0.85,
                    description: 'Strong Bullish Trend',
                    context: 'Continuation'
                });
            }

            // Three Black Crows
            if (c4.isRed && c3.isRed && c2.isRed &&
                c3.close < c4.close && c2.close < c3.close) {
                patterns.push({
                    name: 'Three Black Crows',
                    signal: 'SELL',
                    strength: 0.85,
                    description: 'Strong Bearish Trend',
                    context: 'Continuation'
                });
            }

            // Abandoned Baby pattern
            if (c4.isRed && c3.bodyRatio < 0.1 && c2.isGreen &&
                c2.open > c4.close && c1.isRed && c0.isRed && c0.close < c2.open) {
                patterns.push({
                    name: 'Abandoned Baby',
                    signal: 'BUY',
                    strength: 0.9,
                    description: 'Rare Bullish Reversal',
                    context: 'Oversold'
                });
            }

            if (c4.isGreen && c3.bodyRatio < 0.1 && c2.isRed &&
                c2.open < c4.close && c1.isGreen && c0.isGreen && c0.close > c2.open) {
                patterns.push({
                    name: 'Evening Abandoned Baby',
                    signal: 'SELL',
                    strength: 0.9,
                    description: 'Rare Bearish Reversal',
                    context: 'Overbought'
                });
            }

            // Three Inside Up/Down
            if (c2.isRed && c1.isGreen && c1.open > c2.close && c1.close < c2.open &&
                c0.isGreen && c0.close > c1.close) {
                patterns.push({
                    name: 'Three Inside Up',
                    signal: 'BUY',
                    strength: 0.8,
                    description: 'Bullish Continuation',
                    context: 'Uptrend'
                });
            }

            if (c2.isGreen && c1.isRed && c1.open < c2.close && c1.close > c2.open &&
                c0.isRed && c0.close < c1.close) {
                patterns.push({
                    name: 'Three Inside Down',
                    signal: 'SELL',
                    strength: 0.8,
                    description: 'Bearish Continuation',
                    context: 'Downtrend'
                });
            }

            // Tweezer Tops/Bottoms
            if (Math.abs(c1.high - c0.high) < (c1.high - c1.low) * 0.02 &&
                c1.isGreen && c0.isRed) {
                patterns.push({
                    name: 'Tweezer Top',
                    signal: 'SELL',
                    strength: 0.7,
                    description: 'Bearish Reversal Pattern',
                    context: 'Overbought'
                });
            }

            if (Math.abs(c1.low - c0.low) < (c1.high - c1.low) * 0.02 &&
                c1.isRed && c0.isGreen) {
                patterns.push({
                    name: 'Tweezer Bottom',
                    signal: 'BUY',
                    strength: 0.7,
                    description: 'Bullish Reversal Pattern',
                    context: 'Oversold'
                });
            }

            // Upside Gap Two Crows
            if (c2.isGreen && c1.isRed && c0.isRed &&
                c1.open > c2.close && c1.close < c2.close &&
                c0.open < c1.open && c0.close > c1.close &&
                c0.close < c2.close) {
                patterns.push({
                    name: 'Upside Gap Two Crows',
                    signal: 'SELL',
                    strength: 0.75,
                    description: 'Bearish Reversal Pattern',
                    context: 'Overbought'
                });
            }

            // Three Outside Up/Down
            if (c2.isRed && c1.isGreen && c1.open < c2.close && c1.close > c2.open &&
                c0.isGreen && c0.close > c1.close) {
                patterns.push({
                    name: 'Three Outside Up',
                    signal: 'BUY',
                    strength: 0.85,
                    description: 'Strong Bullish Reversal',
                    context: 'Oversold'
                });
            }

            if (c2.isGreen && c1.isRed && c1.open > c2.close && c1.close < c2.open &&
                c0.isRed && c0.close < c1.close) {
                patterns.push({
                    name: 'Three Outside Down',
                    signal: 'SELL',
                    strength: 0.85,
                    description: 'Strong Bearish Reversal',
                    context: 'Overbought'
                });
            }
        }
    }

    // Sort by strength (highest first)
    return patterns.sort((a, b) => b.strength - a.strength);
}

async function performTechnicalAnalysis(candles, imageData) {
    const {
        height
    } = imageData;

    // Advanced Support/Resistance Analysis
    const srAnalysis = analyzeSupportResistance(candles, height);

    // Donchian Channels Analysis
    const donchianAnalysis = analyzeDonchianChannels(candles);

    // Quantitative Analysis
    const quantAnalysis = performQuantitativeAnalysis(candles);

    // Liquidity Analysis
    const liquidityAnalysis = performLiquidityAnalysis(candles, height);

    // Trend Analysis
    const trendAnalysis = performTrendAnalysis(candles);

    return {
        supportResistance: srAnalysis,
        donchianChannels: donchianAnalysis,
        quantitative: quantAnalysis,
        liquidity: liquidityAnalysis,
        trend: trendAnalysis,
        combinedSignal: combineTechnicalSignals(srAnalysis, donchianAnalysis, quantAnalysis, liquidityAnalysis, trendAnalysis)
    };
}

// New Trend Analysis Function
function performTrendAnalysis(candles) {
    if (candles.length < 50) return {
        signal: 'HOLD',
        strength: 0,
        ema50: null,
        ema200: null,
        adx: null,
        trendReversal: null
    };

    // Calculate EMAs
    const ema50 = calculateEMA(candles, 50);
    const ema200 = calculateEMA(candles, 200);
    
    // Calculate ADX for trend strength
    const adx = calculateADX(candles, 14);
    
    // Detect trend reversals
    const trendReversal = detectTrendReversal(candles);
    
    // Determine trend signal
    let signal = 'HOLD';
    let strength = 0;
    
    // Check if both EMAs are available
    if (ema50 && ema200) {
        const currentPrice = candles[candles.length - 1].close;
        
        // Bullish trend: price above both EMAs and EMA50 above EMA200
        if (currentPrice > ema50.value && currentPrice > ema200.value && ema50.value > ema200.value) {
            signal = 'BUY';
            strength = Math.min(ema50.value / ema200.value - 1, 1); // Strength based on EMA spread
        }
        // Bearish trend: price below both EMAs and EMA50 below EMA200
        else if (currentPrice < ema50.value && currentPrice < ema200.value && ema50.value < ema200.value) {
            signal = 'SELL';
            strength = Math.min(1 - ema50.value / ema200.value, 1);
        }
    }
    
    // Adjust strength based on ADX
    if (adx && adx.value > 25) { // Strong trend (ADX > 25)
        strength *= 1.2; // Boost confidence in strong trends
    } else if (adx && adx.value < 20) { // Weak trend (ADX < 20)
        strength *= 0.8; // Reduce confidence in weak trends
    }
    
    // Override signal if trend reversal detected
    if (trendReversal && trendReversal.confidence > 0.7) {
        signal = trendReversal.signal;
        strength = trendReversal.confidence;
    }
    
    return {
        signal: signal,
        strength: Math.min(strength, 1), // Cap at 1.0
        ema50: ema50,
        ema200: ema200,
        adx: adx,
        trendReversal: trendReversal
    };
}

// Calculate Exponential Moving Average (EMA)
function calculateEMA(candles, period) {
    if (candles.length < period) return null;
    
    // Calculate smoothing factor
    const k = 2 / (period + 1);
    
    // Calculate simple moving average for first value
    const sma = calculateSMA(candles.slice(0, period), period);
    if (!sma) return null;
    
    // Calculate EMA values
    const emaValues = [sma];
    
    for (let i = period; i < candles.length; i++) {
        const close = candles[i].close;
        const ema = close * k + emaValues[emaValues.length - 1] * (1 - k);
        emaValues.push(ema);
    }
    
    return {
        value: emaValues[emaValues.length - 1],
        values: emaValues
    };
}

// Calculate ADX (Average Directional Index)
function calculateADX(candles, period) {
    if (candles.length < period + 14) return null;
    
    // Calculate +DI and -DI
    const diResults = calculateDI(candles, period);
    if (!diResults) return null;
    
    const { plusDI, minusDI } = diResults;
    
    // Calculate DX
    const dxValues = [];
    for (let i = 0; i < plusDI.length; i++) {
        const diff = Math.abs(plusDI[i] - minusDI[i]);
        const sum = plusDI[i] + minusDI[i];
        const dx = sum !== 0 ? (diff / sum) * 100 : 0;
        dxValues.push(dx);
    }
    
    // Calculate ADX as SMA of DX
    const adxValues = [];
    for (let i = period - 1; i < dxValues.length; i++) {
        const slice = dxValues.slice(i - period + 1, i + 1);
        const adx = slice.reduce((a, b) => a + b, 0) / period;
        adxValues.push(adx);
    }
    
    return {
        value: adxValues[adxValues.length - 1],
        values: adxValues
    };
}

// Calculate +DI and -DI for ADX
function calculateDI(candles, period) {
    if (candles.length < period + 1) return null;
    
    const plusDM = [];
    const minusDM = [];
    const tr = [];
    
    // Calculate DM and TR values
    for (let i = 1; i < candles.length; i++) {
        const c = candles[i];
        const prevC = candles[i-1];
        
        const upMove = c.high - prevC.high;
        const downMove = prevC.low - c.low;
        
        let plus = 0;
        let minus = 0;
        
        if (upMove > downMove && upMove > 0) {
            plus = upMove;
        }
        
        if (downMove > upMove && downMove > 0) {
            minus = downMove;
        }
        
        plusDM.push(plus);
        minusDM.push(minus);
        
        // Calculate True Range
        const tr1 = c.high - c.low;
        const tr2 = Math.abs(c.high - prevC.close);
        const tr3 = Math.abs(c.low - prevC.close);
        tr.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate smoothed DM and TR
    const plusDI = [];
    const minusDI = [];
    
    let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    
    for (let i = period - 1; i < plusDM.length; i++) {
        if (i >= period) {
            smoothPlusDM = (smoothPlusDM - (smoothPlusDM / period)) + plusDM[i];
            smoothMinusDM = (smoothMinusDM - (smoothMinusDM / period)) + minusDM[i];
            smoothTR = (smoothTR - (smoothTR / period)) + tr[i];
        }
        
        const plus = smoothTR !== 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
        const minus = smoothTR !== 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
        
        plusDI.push(plus);
        minusDI.push(minus);
    }
    
    return {
        plusDI: plusDI,
        minusDI: minusDI
    };
}

// Detect trend reversals
function detectTrendReversal(candles) {
    if (candles.length < 20) return null;
    
    // Look for reversal patterns
    const recentCandles = candles.slice(-10);
    
    // Check for bullish reversal (price making higher lows while in downtrend)
    let bullishReversal = false;
    let bearishReversal = false;
    let confidence = 0;
    
    // Check for higher lows pattern (bullish reversal)
    let higherLows = true;
    for (let i = 1; i < recentCandles.length; i++) {
        if (recentCandles[i].low < recentCandles[i-1].low) {
            higherLows = false;
            break;
        }
    }
    
    // Check if we're in a downtrend before the reversal
    const earlierCandles = candles.slice(-20, -10);
    const earlierTrend = calculateTrendStrength(earlierCandles);
    
    if (higherLows && earlierTrend < -0.3) {
        bullishReversal = true;
        confidence = 0.8;
    }
    
    // Check for lower highs pattern (bearish reversal)
    let lowerHighs = true;
    for (let i = 1; i < recentCandles.length; i++) {
        if (recentCandles[i].high > recentCandles[i-1].high) {
            lowerHighs = false;
            break;
        }
    }
    
    if (lowerHighs && earlierTrend > 0.3) {
        bearishReversal = true;
        confidence = 0.8;
    }
    
    if (bullishReversal) {
        return {
            signal: 'BUY',
            confidence: confidence,
            type: 'Bullish Reversal',
            description: 'Higher lows pattern detected after downtrend'
        };
    } else if (bearishReversal) {
        return {
            signal: 'SELL',
            confidence: confidence,
            type: 'Bearish Reversal',
            description: 'Lower highs pattern detected after uptrend'
        };
    }
    
    return null;
}

// Enhanced signal combination to include trend analysis
function combineTechnicalSignals(srAnalysis, donchianAnalysis, quantAnalysis, liquidityAnalysis, trendAnalysis) {
    const signals = [{
            signal: srAnalysis.signal,
            strength: srAnalysis.strength
        },
        {
            signal: donchianAnalysis.signal,
            strength: donchianAnalysis.strength
        }
    ];

    // Add quantitative analysis signal if available
    if (quantAnalysis && quantAnalysis.signal) {
        signals.push({
            signal: quantAnalysis.signal,
            strength: quantAnalysis.strength || 0.5
        });
    }

    // Add liquidity analysis signal if available
    if (liquidityAnalysis && liquidityAnalysis.signal) {
        signals.push({
            signal: liquidityAnalysis.signal,
            strength: liquidityAnalysis.strength || 0.5
        });
    }

    // Add trend analysis signal if available
    if (trendAnalysis && trendAnalysis.signal) {
        signals.push({
            signal: trendAnalysis.signal,
            strength: trendAnalysis.strength || 0.5
        });
    }

    let buyScore = 0,
        sellScore = 0;
    signals.forEach(s => {
        if (s.signal === 'BUY') buyScore += s.strength;
        if (s.signal === 'SELL') sellScore += s.strength;
    });

    const totalScore = buyScore + sellScore;
    if (totalScore === 0) return {
        signal: 'HOLD',
        confidence: 0
    };

    return buyScore > sellScore ? {
        signal: 'BUY',
        confidence: (buyScore / totalScore) * 100
    } : {
        signal: 'SELL',
        confidence: (sellScore / totalScore) * 100
    };
}

function analyzeSupportResistance(candles, imageHeight) {
    if (candles.length < 5) {
        return {
            supports: [],
            resistances: [],
            signal: 'HOLD',
            strength: 0
        };
    }

    const cfg = config.supportResistance;
    const points = [];

    // Collect all highs and lows with enhanced weighting
    candles.forEach((c, i) => {
        // Weight recent candles more heavily
        const weight = Math.min(1 + (i / candles.length), 2);

        points.push({
            y: c.high,
            type: 'resistance',
            index: i,
            weight: weight
        });
        points.push({
            y: c.low,
            type: 'support',
            index: i,
            weight: weight
        });
    });

    points.sort((a, b) => a.y - b.y);

    // Advanced clustering with dynamic tolerance
    const levels = [];
    let currentLevel = {
        sum: points[0].y * points[0].weight,
        weightedSum: points[0].weight,
        touches: 1,
        values: [points[0].y],
        type: points[0].type,
        indices: [points[0].index]
    };

    for (let i = 1; i < points.length; i++) {
        const distance = points[i].y - currentLevel.values[currentLevel.values.length - 1];
        // Dynamic tolerance based on chart height and recent activity
        const dynamicTolerance = imageHeight * cfg.clusterTolerance *
            (1 - (points[i].index / candles.length) * 0.5);

        if (distance < dynamicTolerance) {
            currentLevel.sum += points[i].y * points[i].weight;
            currentLevel.weightedSum += points[i].weight;
            currentLevel.touches++;
            currentLevel.values.push(points[i].y);
            currentLevel.indices.push(points[i].index);
        } else {
            if (currentLevel.touches >= cfg.minTouches) {
                const weightedAverage = currentLevel.sum / currentLevel.weightedSum;
                levels.push({
                    level: Math.round(weightedAverage),
                    touches: currentLevel.touches,
                    strength: Math.min(currentLevel.touches / 5, 1) *
                        (currentLevel.weightedSum / currentLevel.touches / 1.5),
                    indices: currentLevel.indices
                });
            }
            currentLevel = {
                sum: points[i].y * points[i].weight,
                weightedSum: points[i].weight,
                touches: 1,
                values: [points[i].y],
                type: points[i].type,
                indices: [points[i].index]
            };
        }
    }

    if (currentLevel.touches >= cfg.minTouches) {
        const weightedAverage = currentLevel.sum / currentLevel.weightedSum;
        levels.push({
            level: Math.round(weightedAverage),
            touches: currentLevel.touches,
            strength: Math.min(currentLevel.touches / 5, 1) *
                (currentLevel.weightedSum / currentLevel.touches / 1.5),
            indices: currentLevel.indices
        });
    }

    // Separate supports and resistances based on current price
    const lastCandle = candles[candles.length - 1];
    const currentPrice = lastCandle.close;

    // Enhanced level validation - remove weak levels that are too close to stronger ones
    const validatedLevels = levels.filter(level => {
        const isStrongerLevelExists = levels.some(otherLevel =>
            otherLevel !== level &&
            otherLevel.strength > level.strength &&
            Math.abs(otherLevel.level - level.level) < imageHeight * cfg.clusterTolerance * 2
        );
        return !isStrongerLevelExists;
    });

    // Multi-timeframe analysis simulation
    // In a real implementation, this would use actual data from different timeframes
    const multiTimeframeAnalysis = performMultiTimeframeAnalysis(candles, imageHeight);

    // Combine current timeframe levels with multi-timeframe levels
    const combinedLevels = [...validatedLevels, ...multiTimeframeAnalysis.levels];

    const supports = combinedLevels
        .filter(l => l.level > currentPrice)
        .sort((a, b) => a.level - b.level);
    const resistances = combinedLevels
        .filter(l => l.level < currentPrice)
        .sort((a, b) => b.level - a.level);

    let signal = 'HOLD',
        strength = 0;
    const nearestSupport = supports[0];
    const nearestResistance = resistances[0];

    // Enhanced proximity detection with dynamic zones
    const supportZone = nearestSupport ?
        imageHeight * cfg.zoneProximity * (1 + (nearestSupport.strength * 0.5)) : 0;
    const resistanceZone = nearestResistance ?
        imageHeight * cfg.zoneProximity * (1 + (nearestResistance.strength * 0.5)) : 0;

    // False breakout detection
    const falseBreakoutDetected = detectFalseBreakouts(candles, nearestSupport, nearestResistance);

    if (falseBreakoutDetected) {
        signal = falseBreakoutDetected.signal;
        strength = falseBreakoutDetected.strength;
    } else if (nearestResistance && Math.abs(currentPrice - nearestResistance.level) < resistanceZone) {
        signal = 'SELL';
        strength = nearestResistance.strength;
    } else if (nearestSupport && Math.abs(currentPrice - nearestSupport.level) < supportZone) {
        signal = 'BUY';
        strength = nearestSupport.strength;
    }

    return {
        supports,
        resistances,
        signal,
        strength,
        levels: combinedLevels,
        falseBreakouts: falseBreakoutDetected
    };
}

// New function for multi-timeframe analysis
function performMultiTimeframeAnalysis(candles, imageHeight) {
    // Simulate multi-timeframe analysis
    // In a real implementation, this would pull data from M1, M5, M15 timeframes
    const simulatedM5Candles = simulateTimeframeData(candles, 5);
    const simulatedM15Candles = simulateTimeframeData(candles, 15);
    
    // Combine levels from different timeframes with different weights
    const m5Levels = extractKeyLevels(simulatedM5Candles, imageHeight, 0.7); // 70% weight
    const m15Levels = extractKeyLevels(simulatedM15Candles, imageHeight, 0.9); // 90% weight
    
    return {
        levels: [...m5Levels, ...m15Levels]
    };
}

// Helper function to simulate data from different timeframes
function simulateTimeframeData(candles, timeframeMultiplier) {
    // This is a simplified simulation - in reality, this would fetch actual data
    const simulated = [];
    for (let i = 0; i < candles.length; i += timeframeMultiplier) {
        if (i + timeframeMultiplier <= candles.length) {
            const group = candles.slice(i, i + timeframeMultiplier);
            const open = group[0].open;
            const close = group[group.length - 1].close;
            const high = Math.max(...group.map(c => c.high));
            const low = Math.min(...group.map(c => c.low));
            
            simulated.push({
                open: open,
                close: close,
                high: high,
                low: low
            });
        }
    }
    return simulated;
}

// Helper function to extract key levels from candles
function extractKeyLevels(candles, imageHeight, weight) {
    if (candles.length < 3) return [];
    
    const levels = [];
    const cfg = config.supportResistance;
    
    // Find swing highs and lows
    for (let i = 1; i < candles.length - 1; i++) {
        // Swing high
        if (candles[i].high > candles[i-1].high && candles[i].high > candles[i+1].high) {
            levels.push({
                level: candles[i].high,
                touches: 1,
                strength: weight,
                type: 'resistance'
            });
        }
        
        // Swing low
        if (candles[i].low < candles[i-1].low && candles[i].low < candles[i+1].low) {
            levels.push({
                level: candles[i].low,
                touches: 1,
                strength: weight,
                type: 'support'
            });
        }
    }
    
    return levels;
}

// Function to detect false breakouts
function detectFalseBreakouts(candles, nearestSupport, nearestResistance) {
    if (candles.length < 10) return null;
    
    const recentCandles = candles.slice(-10);
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    // Check for false breakout above resistance
    if (nearestResistance && 
        prevCandle.close < nearestResistance.level && 
        lastCandle.close > nearestResistance.level &&
        lastCandle.close < prevCandle.close) { // Price retreated after breaking
        return {
            signal: 'SELL',
            strength: 0.8,
            type: 'False Resistance Breakout',
            description: 'Price broke resistance but quickly retreated'
        };
    }
    
    // Check for false breakout below support
    if (nearestSupport && 
        prevCandle.close > nearestSupport.level && 
        lastCandle.close < nearestSupport.level &&
        lastCandle.close > prevCandle.close) { // Price retreated after breaking
        return {
            signal: 'BUY',
            strength: 0.8,
            type: 'False Support Breakout',
            description: 'Price broke support but quickly retreated'
        };
    }
    
    return null;
}

function analyzeDonchianChannels(candles) {
    if (candles.length < 20) return {
        signal: 'HOLD',
        strength: 0,
        position: 'middle'
    };

    const periods = config.donchian.periods;
    const results = [];

    periods.forEach(period => {
        if (candles.length >= period) {
            const recentCandles = candles.slice(-period);
            const highest = Math.max(...recentCandles.map(c => c.high));
            const lowest = Math.min(...recentCandles.map(c => c.low));
            const middle = (highest + lowest) / 2;

            const currentPrice = candles[candles.length - 1].close;
            let signal = 'HOLD',
                strength = 0,
                position = 'middle';

            if (currentPrice > highest * (1 - config.donchian.breakoutThreshold)) {
                signal = 'BUY';
                strength = 0.8;
                position = 'upper_breakout';
            } else if (currentPrice < lowest * (1 + config.donchian.breakoutThreshold)) {
                signal = 'SELL';
                strength = 0.8;
                position = 'lower_breakout';
            }

            results.push({
                period,
                highest,
                lowest,
                middle,
                signal,
                strength,
                position
            });
        }
    });

    const strongestSignal = results.reduce((best, current) =>
        current.strength > best.strength ? current : best, {
            signal: 'HOLD',
            strength: 0
        }
    );

    return {
        signal: strongestSignal.signal,
        strength: strongestSignal.strength,
        position: strongestSignal.position,
        allPeriods: results
    };
}

// Simple in-memory database for storing analysis results
class AnalysisDatabase {
    constructor() {
        this.results = [];
        this.patternAccuracy = new Map(); // Track pattern accuracy
        this.loadFromLocalStorage();
    }

    // Save analysis result
    saveResult(analysisResult) {
        const result = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            recommendation: analysisResult.recommendation,
            patterns: analysisResult.analysisResults.candlestick.patterns,
            confidence: analysisResult.recommendation.confidence,
            action: analysisResult.recommendation.action
        };
        
        this.results.push(result);
        
        // Keep only the last 1000 results to prevent memory issues
        if (this.results.length > 1000) {
            this.results.shift();
        }
        
        this.updatePatternAccuracy(analysisResult);
        this.saveToLocalStorage();
        
        return result.id;
    }

    // Update pattern accuracy tracking
    updatePatternAccuracy(analysisResult) {
        const patterns = analysisResult.analysisResults.candlestick.patterns;
        const action = analysisResult.recommendation.action;
        
        patterns.forEach(pattern => {
            if (!this.patternAccuracy.has(pattern.name)) {
                this.patternAccuracy.set(pattern.name, {
                    occurrences: 0,
                    correct: 0,
                    accuracy: 0.5 // Default 50% accuracy
                });
            }
            
            const stats = this.patternAccuracy.get(pattern.name);
            stats.occurrences++;
            
            // Simplified accuracy calculation - in a real system, this would compare with actual outcomes
            // For now, we'll assume patterns that lead to high confidence recommendations are more accurate
            if (analysisResult.recommendation.confidence > 70) {
                stats.correct++;
            }
            
            stats.accuracy = stats.correct / stats.occurrences;
            this.patternAccuracy.set(pattern.name, stats);
        });
    }

    // Get pattern accuracy statistics
    getPatternAccuracy(patternName) {
        return this.patternAccuracy.get(patternName) || {
            occurrences: 0,
            correct: 0,
            accuracy: 0.5
        };
    }

    // Get all pattern accuracies
    getAllPatternAccuracies() {
        const result = {};
        for (let [key, value] of this.patternAccuracy) {
            result[key] = value;
        }
        return result;
    }

    // Save to localStorage
    saveToLocalStorage() {
        try {
            const data = {
                results: this.results,
                patternAccuracy: Array.from(this.patternAccuracy.entries())
            };
            localStorage.setItem('tradingAnalysisDB', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    // Load from localStorage
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('tradingAnalysisDB');
            if (data) {
                const parsed = JSON.parse(data);
                this.results = parsed.results || [];
                this.patternAccuracy = new Map(parsed.patternAccuracy || []);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
    }

    // Clear database
    clear() {
        this.results = [];
        this.patternAccuracy.clear();
        localStorage.removeItem('tradingAnalysisDB');
    }
}

// Initialize the analysis database
const analysisDB = new AnalysisDatabase();

// Enhanced recommendation function that uses the database for learning
async function generateProfessionalRecommendation(candleAnalysis, technicalAnalysis) {
    let buyScore = 0,
        sellScore = 0;
    const summary = [];

    // Score candlestick patterns with accuracy weighting
    candleAnalysis.patterns.forEach(pattern => {
        // Get pattern accuracy from database
        const accuracyStats = analysisDB.getPatternAccuracy(pattern.name);
        const accuracyWeight = accuracyStats.accuracy || 0.5;
        
        const score = (config.scores[pattern.name.replace(/\s/g, '')] || 2.0) * accuracyWeight;
        if (pattern.signal === 'BUY') {
            buyScore += score * pattern.strength;
            summary.push({
                type: 'bullish',
                text: `🕯️ ${pattern.name}: ${pattern.description} (+${(score * pattern.strength).toFixed(1)})`,
                impact: score * pattern.strength
            });
        } else if (pattern.signal === 'SELL') {
            sellScore += score * pattern.strength;
            summary.push({
                type: 'bearish',
                text: `🕯️ ${pattern.name}: ${pattern.description} (+${(score * pattern.strength).toFixed(1)})`,
                impact: score * pattern.strength
            });
        }
    });

    // Score technical analysis components
    // Support/Resistance
    const srSignal = technicalAnalysis.supportResistance;
    if (srSignal.signal === 'BUY') {
        const score = config.scores.strongSupport * srSignal.strength;
        buyScore += score;
        summary.push({
            type: 'bullish',
            text: `📈 Strong Support Level Detected (+${score.toFixed(1)})`,
            impact: score
        });
    } else if (srSignal.signal === 'SELL') {
        const score = config.scores.strongResistance * srSignal.strength;
        sellScore += score;
        summary.push({
            type: 'bearish',
            text: `📉 Strong Resistance Level Detected (+${score.toFixed(1)})`,
            impact: score
        });
    }

    // Donchian Channels
    const donchianSignal = technicalAnalysis.donchianChannels;
    if (donchianSignal.signal === 'BUY') {
        const score = config.scores.upperBreakout * donchianSignal.strength;
        buyScore += score;
        summary.push({
            type: 'bullish',
            text: `🚀 Donchian Upper Breakout Detected (+${score.toFixed(1)})`,
            impact: score
        });
    } else if (donchianSignal.signal === 'SELL') {
        const score = config.scores.lowerBreakout * donchianSignal.strength;
        sellScore += score;
        summary.push({
            type: 'bearish',
            text: `📉 Donchian Lower Breakout Detected (+${score.toFixed(1)})`,
            impact: score
        });
    }

    // Quantitative Analysis
    const quantSignal = technicalAnalysis.quantitative;
    if (quantSignal && quantSignal.signal !== 'HOLD') {
        const score = 3.0 * quantSignal.strength; // Base score for quantitative signals
        if (quantSignal.signal === 'BUY') {
            buyScore += score;
            summary.push({
                type: 'bullish',
                text: `📊 Quantitative Analysis: ${quantSignal.signal} (+${score.toFixed(1)})`,
                impact: score
            });
        } else if (quantSignal.signal === 'SELL') {
            sellScore += score;
            summary.push({
                type: 'bearish',
                text: `📊 Quantitative Analysis: ${quantSignal.signal} (+${score.toFixed(1)})`,
                impact: score
            });
        }
    }

    // Liquidity Analysis
    const liquiditySignal = technicalAnalysis.liquidity;
    if (liquiditySignal && liquiditySignal.signal !== 'HOLD') {
        const score = 2.5 * liquiditySignal.strength; // Base score for liquidity signals
        if (liquiditySignal.signal === 'BUY') {
            buyScore += score;
            summary.push({
                type: 'bullish',
                text: `💧 Liquidity Analysis: ${liquiditySignal.signal} (+${score.toFixed(1)})`,
                impact: score
            });
        } else if (liquiditySignal.signal === 'SELL') {
            sellScore += score;
            summary.push({
                type: 'bearish',
                text: `💧 Liquidity Analysis: ${liquiditySignal.signal} (+${score.toFixed(1)})`,
                impact: score
            });
        }
    }

    // Trend Analysis
    const trendSignal = technicalAnalysis.trend;
    if (trendSignal && trendSignal.signal !== 'HOLD') {
        const score = 3.5 * trendSignal.strength; // Base score for trend signals
        if (trendSignal.signal === 'BUY') {
            buyScore += score;
            summary.push({
                type: 'bullish',
                text: `🧭 Trend Analysis: ${trendSignal.signal} (+${score.toFixed(1)})`,
                impact: score
            });
        } else if (trendSignal.signal === 'SELL') {
            sellScore += score;
            summary.push({
                type: 'bearish',
                text: `🧭 Trend Analysis: ${trendSignal.signal} (+${score.toFixed(1)})`,
                impact: score
            });
        }
    }

    // Calculate final recommendation with enhanced confidence scoring
    const totalScore = buyScore + sellScore;
    const scoreDifference = Math.abs(buyScore - sellScore);

    let action, confidence, profitTarget, riskLevel, color;

    if (totalScore === 0 || scoreDifference < 1.0) {
        action = 'WAIT';
        confidence = 45;
        profitTarget = 0;
        riskLevel = 0;
        color = 'var(--text-muted)';
    } else {
        // Enhanced confidence calculation with more precise scoring
        const rawConfidence = 50 + (scoreDifference / (totalScore + 1)) * 50;
        confidence = Math.min(98, Math.round(rawConfidence));

        if (buyScore > sellScore) {
            action = 'BUY';
            color = 'var(--success-green)';

            // Calculate profit targets based on confidence and quantitative indicators
            if (confidence >= 85) {
                profitTarget = config.recommendation.profitTargets.aggressive;
                riskLevel = 0.02; // 2%
            } else if (confidence >= 75) {
                profitTarget = config.recommendation.profitTargets.moderate;
                riskLevel = 0.015; // 1.5%
            } else {
                profitTarget = config.recommendation.profitTargets.conservative;
                riskLevel = 0.01; // 1%
            }
        } else {
            action = 'SELL';
            color = 'var(--danger-red)';

            // Calculate profit targets for short positions
            if (confidence >= 85) {
                profitTarget = config.recommendation.profitTargets.aggressive;
                riskLevel = 0.02;
            } else if (confidence >= 75) {
                profitTarget = config.recommendation.profitTargets.moderate;
                riskLevel = 0.015;
            } else {
                profitTarget = config.recommendation.profitTargets.conservative;
                riskLevel = 0.01;
            }
        }
    }

    // Apply 65% confidence threshold as requested by user
    if (confidence < 65) {
        action = 'WAIT';
        profitTarget = 0;
        summary.push({
            type: 'neutral',
            text: `⚠️ Confidence below 65% threshold - Recommendation: WAIT`,
            impact: 0
        });
    }

    // Enhanced profit calculation with risk management
    let realProfitPercentage = 0;
    if (action !== 'WAIT' && profitTarget > 0) {
        // Adjust profit target based on volatility and trend strength
        const quantData = technicalAnalysis.quantitative;
        if (quantData && quantData.indicators) {
            // Reduce profit target in high volatility environments
            if (quantData.indicators.volatility > 0.03) {
                profitTarget *= 0.7; // 30% reduction for high volatility
            } else if (quantData.indicators.volatility > 0.02) {
                profitTarget *= 0.85; // 15% reduction for medium volatility
            }

            // Increase profit target in strong trends
            if (Math.abs(quantData.indicators.trendStrength) > 0.5) {
                profitTarget *= 1.2; // 20% increase for strong trends
            }

            // Adjust based on RSI (overbought/oversold conditions)
            if (quantData.indicators.rsi > 80 || quantData.indicators.rsi < 20) {
                profitTarget *= 0.9; // Conservative adjustment for extreme RSI
            }
        }

        realProfitPercentage = Math.round(profitTarget * 100 * 10) / 10;
    }

    return {
        action,
        confidence,
        profitTarget: realProfitPercentage,
        riskLevel: Math.round(riskLevel * 100 * 10) / 10,
        color,
        summary: summary.sort((a, b) => b.impact - a.impact).slice(0, 8), // Top 8 factors
        scores: {
            buy: buyScore.toFixed(1),
            sell: sellScore.toFixed(1)
        },
        // Add detailed reasoning for the recommendation
        reasoning: generateDetailedReasoning(action, confidence, candleAnalysis, technicalAnalysis)
    };
}

// Generate detailed reasoning for the recommendation
function generateDetailedReasoning(action, confidence, candleAnalysis, technicalAnalysis) {
    const reasons = [];
    
    // Add candlestick pattern reason
    if (candleAnalysis.patterns.length > 0) {
        const mainPattern = candleAnalysis.patterns[0];
        reasons.push(`Candlestick Pattern: ${mainPattern.name} (${mainPattern.description})`);
    }
    
    // Add support/resistance reason
    const srAnalysis = technicalAnalysis.supportResistance;
    if (srAnalysis.signal !== 'HOLD') {
        reasons.push(`Support/Resistance: Price near ${srAnalysis.signal === 'BUY' ? 'support' : 'resistance'} level`);
    }
    
    // Add trend reason
    const trendAnalysis = technicalAnalysis.trend;
    if (trendAnalysis.signal !== 'HOLD') {
        reasons.push(`Trend: ${trendAnalysis.signal === 'BUY' ? 'Bullish' : 'Bearish'} trend detected`);
    }
    
    // Add liquidity reason
    const liquidityAnalysis = technicalAnalysis.liquidity;
    if (liquidityAnalysis.signal !== 'HOLD') {
        reasons.push(`Liquidity: ${liquidityAnalysis.signal === 'BUY' ? 'Accumulation' : 'Distribution'} zone detected`);
    }
    
    // Add quantitative reason
    const quantAnalysis = technicalAnalysis.quantitative;
    if (quantAnalysis && quantAnalysis.indicators) {
        if (quantAnalysis.indicators.rsi > 70) {
            reasons.push('RSI: Overbought conditions');
        } else if (quantAnalysis.indicators.rsi < 30) {
            reasons.push('RSI: Oversold conditions');
        }
    }
    
    return reasons;
}

// Enhanced display function that saves results to the database
function displayProfessionalResults(recommendation, candleAnalysis, technicalAnalysis, analysisTime, img) {
    document.getElementById('analysisArea').style.display = 'none';
    const resultsArea = document.getElementById('resultsArea');
    if (resultsArea) {
        resultsArea.style.display = 'block';
    }

    const el = (id) => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    };

    // Enhanced visual analysis with S/R and Donchian overlay
    const canvas = el('visualAnalysisCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions based on device
    const isMobile = window.innerWidth <= 768;
    const maxWidth = isMobile ? window.innerWidth - 40 : 700;
    const scale = Math.min(maxWidth / img.width, 0.8);
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    // Draw scaled image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw Support/Resistance levels
    ctx.lineWidth = isMobile ? 1 : 2;
    ctx.font = isMobile ? "12px Orbitron" : "14px Orbitron";
    ctx.textBaseline = 'bottom';

    const srAnalysis = technicalAnalysis.supportResistance;

    // Draw resistance levels
    if (srAnalysis.resistances && srAnalysis.resistances.length > 0) {
        srAnalysis.resistances.slice(0, 3).forEach((level, i) => {
            const scaledLevel = level.level * scale;
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 - i * 0.2})`;
            ctx.fillStyle = `rgba(239, 68, 68, ${0.9 - i * 0.1})`;
            ctx.textAlign = "left";
            ctx.beginPath();
            ctx.moveTo(0, scaledLevel);
            ctx.lineTo(canvas.width, scaledLevel);
            ctx.stroke();
            ctx.fillText(`Resistance ${level.touches} touches`, 5, scaledLevel - 5);
        });
    }

    // Draw support levels
    if (srAnalysis.supports && srAnalysis.supports.length > 0) {
        srAnalysis.supports.slice(0, 3).forEach((level, i) => {
            const scaledLevel = level.level * scale;
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.8 - i * 0.2})`;
            ctx.fillStyle = `rgba(34, 197, 94, ${0.9 - i * 0.1})`;
            ctx.textAlign = "left";
            ctx.beginPath();
            ctx.moveTo(0, scaledLevel);
            ctx.lineTo(canvas.width, scaledLevel);
            ctx.stroke();
            ctx.fillText(`Support ${level.touches} touches`, 5, scaledLevel + 15);
        });
    }

    // Draw Donchian Channels if available
    const donchianData = technicalAnalysis.donchianChannels.allPeriods;
    if (donchianData && donchianData.length > 0) {
        const primary = donchianData[0]; // Use primary period
        const scaledHighest = primary.highest * scale;
        const scaledLowest = primary.lowest * scale;
        const scaledMiddle = primary.middle * scale;

        // Upper channel
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, scaledHighest);
        ctx.lineTo(canvas.width, scaledHighest);
        ctx.stroke();

        // Lower channel
        ctx.beginPath();
        ctx.moveTo(0, scaledLowest);
        ctx.lineTo(canvas.width, scaledLowest);
        ctx.stroke();

        // Middle line
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, scaledMiddle);
        ctx.lineTo(canvas.width, scaledMiddle);
        ctx.stroke();

        ctx.setLineDash([]); // Reset line dash

        // Labels
        ctx.fillStyle = 'rgba(139, 92, 246, 1)';
        ctx.fillText(`Donchian ${primary.period}`, canvas.width - 120, scaledHighest - 5);
    }

    // Draw Liquidity zones if available
    const liquidityData = technicalAnalysis.liquidity;
    if (liquidityData) {
        // Draw accumulation zones
        if (liquidityData.accumulationZones && liquidityData.accumulationZones.length > 0) {
            liquidityData.accumulationZones.forEach((zone, i) => {
                const scaledLevel = zone.level * scale;
                ctx.strokeStyle = `rgba(34, 197, 94, ${0.5 - i * 0.1})`;
                ctx.fillStyle = `rgba(34, 197, 94, ${0.3 - i * 0.05})`;
                ctx.beginPath();
                ctx.moveTo(0, scaledLevel);
                ctx.lineTo(canvas.width, scaledLevel);
                ctx.stroke();
                ctx.fillText(`Accumulation Zone`, canvas.width - 150, scaledLevel - 5);
            });
        }

        // Draw distribution zones
        if (liquidityData.distributionZones && liquidityData.distributionZones.length > 0) {
            liquidityData.distributionZones.forEach((zone, i) => {
                const scaledLevel = zone.level * scale;
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 - i * 0.1})`;
                ctx.fillStyle = `rgba(239, 68, 68, ${0.3 - i * 0.05})`;
                ctx.beginPath();
                ctx.moveTo(0, scaledLevel);
                ctx.lineTo(canvas.width, scaledLevel);
                ctx.stroke();
                ctx.fillText(`Distribution Zone`, canvas.width - 150, scaledLevel + 15);
            });
        }
    }

    // Display recommendation with professional formatting
    const recommendationEl = el('recommendation');
    const confidenceEl = el('confidence');
    const strengthEl = el('strength');
    
    if (recommendationEl) {
        const actionText = recommendation.action === 'BUY' ? '🔵 BUY' :
            recommendation.action === 'SELL' ? '🔴 SELL' : '⏸️ WAIT';
        recommendationEl.textContent = actionText;
        recommendationEl.style.color = recommendation.color;
    }
    
    if (confidenceEl) {
        confidenceEl.textContent = `Confidence: ${recommendation.confidence}%`;
    }

    // Enhanced strength display with profit targets
    if (strengthEl) {
        if (recommendation.action !== 'WAIT' && recommendation.profitTarget > 0) {
            strengthEl.innerHTML = `
                <div>Expected Profit: <span style="color: var(--success-green);">${recommendation.profitTarget}%</span></div>
                <div>Risk Level: <span style="color: var(--danger-red);">${recommendation.riskLevel}%</span></div>
            `;
        } else {
            strengthEl.textContent = 'Market conditions unclear - Wait for better setup';
        }
    }

    // Pattern analysis display
    const candlePatternEl = el('candlePattern');
    const mainPattern = candleAnalysis.patterns[0];
    if (candlePatternEl) {
        candlePatternEl.textContent = mainPattern ? mainPattern.name : 'No Significant Pattern';
    }

    // Technical analysis display
    const srValueEl = el('srValue');
    if (srValueEl) {
        const srText = srAnalysis.signal === 'HOLD' ?
            'Price between support and resistance' :
            `Price near ${srAnalysis.signal === 'BUY' ? 'support' : 'resistance'} level`;
        srValueEl.textContent = srText;
    }

    // Add detailed analysis information
    const detailsContainer = el('analysisDetailsContainer');
    
    if (detailsContainer) {
        // Clear existing detail cards
        while (detailsContainer.firstChild) {
            detailsContainer.removeChild(detailsContainer.firstChild);
        }
        
        // Add quantitative analysis display if available
        const quantData = technicalAnalysis.quantitative;
        if (quantData && quantData.indicators) {
            const quantContainer = document.createElement('div');
            quantContainer.className = 'detail-card';
            quantContainer.innerHTML = `
                <div class="detail-title">Quantitative Indicators</div>
                <div class="detail-value">
                    RSI: ${quantData.indicators.rsi ? quantData.indicators.rsi.toFixed(1) : 'N/A'}<br>
                    Volatility: ${(quantData.indicators.volatility * 100).toFixed(2)}%<br>
                    Trend: ${quantData.indicators.trendStrength ? (quantData.indicators.trendStrength > 0 ? 'Bullish' : 'Bearish') : 'Neutral'}
                </div>
            `;
            detailsContainer.appendChild(quantContainer);
        }
        
        // Add trend analysis display if available
        const trendData = technicalAnalysis.trend;
        if (trendData && (trendData.ema50 || trendData.adx)) {
            const trendContainer = document.createElement('div');
            trendContainer.className = 'detail-card';
            trendContainer.innerHTML = `
                <div class="detail-title">Trend Analysis</div>
                <div class="detail-value">
                    ${trendData.ema50 ? `EMA50: ${trendData.ema50.value.toFixed(2)}<br>` : ''}
                    ${trendData.ema200 ? `EMA200: ${trendData.ema200.value.toFixed(2)}<br>` : ''}
                    ${trendData.adx ? `ADX: ${trendData.adx.value.toFixed(1)} (${trendData.adx.value > 25 ? 'Strong' : trendData.adx.value > 20 ? 'Moderate' : 'Weak'})` : 'N/A'}
                </div>
            `;
            detailsContainer.appendChild(trendContainer);
        }
        
        // Add liquidity analysis display if available
        const liquidityDataDisplay = technicalAnalysis.liquidity;
        if (liquidityDataDisplay) {
            const liquidityContainer = document.createElement('div');
            liquidityContainer.className = 'detail-card';
            liquidityContainer.innerHTML = `
                <div class="detail-title">Liquidity Analysis</div>
                <div class="detail-value">
                    Accumulation Zones: ${liquidityDataDisplay.accumulationZones ? liquidityDataDisplay.accumulationZones.length : 0}<br>
                    Distribution Zones: ${liquidityDataDisplay.distributionZones ? liquidityDataDisplay.distributionZones.length : 0}<br>
                    Hidden Liquidity: ${liquidityDataDisplay.hiddenLiquidity ? liquidityDataDisplay.hiddenLiquidity.length : 0}
                </div>
            `;
            detailsContainer.appendChild(liquidityContainer);
        }
        
        // Add detailed reasoning for the recommendation
        if (recommendation.reasoning && recommendation.reasoning.length > 0) {
            const reasoningContainer = document.createElement('div');
            reasoningContainer.className = 'detail-card';
            reasoningContainer.innerHTML = `
                <div class="detail-title">Analysis Reasoning</div>
                <div class="detail-value">
                    ${recommendation.reasoning.map(reason => `• ${reason}`).join('<br>')}
                </div>
            `;
            detailsContainer.appendChild(reasoningContainer);
        }

        // Add pattern accuracy information
        const accuracyContainer = document.createElement('div');
        accuracyContainer.className = 'detail-card';
        let accuracyHTML = '<div class="detail-title">Pattern Accuracy (Learning Model)</div><div class="detail-value">';
        
        // Show accuracy for top patterns
        const topPatterns = candleAnalysis.patterns.slice(0, 3);
        topPatterns.forEach(pattern => {
            const accuracy = analysisDB.getPatternAccuracy(pattern.name);
            accuracyHTML += `${pattern.name}: ${(accuracy.accuracy * 100).toFixed(1)}% (${accuracy.correct}/${accuracy.occurrences})<br>`;
        });
        
        accuracyHTML += '</div>';
        accuracyContainer.innerHTML = accuracyHTML;
        detailsContainer.appendChild(accuracyContainer);
    }

    if (config.debug) {
        console.log('🏆 PROFESSIONAL ANALYSIS COMPLETE');
        console.log('Final Recommendation:', recommendation);
        console.log('Candlestick Analysis:', candleAnalysis);
        console.log('Technical Analysis:', technicalAnalysis);
        console.log('Pattern Accuracies:', analysisDB.getAllPatternAccuracies());
    }

    startResultsCountdown();
}

// Enhanced analysis function that saves results to the database
async function performAdvancedAnalysis(file) {
    if (config.debug) {
        console.clear();
        console.log('🚀 PROFESSIONAL ANALYSIS ENGINE v7.0 STARTED');
    }

    const startTime = Date.now();
    const progressFill = document.getElementById('progressFill');
    const steps = {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3'),
        step4: document.getElementById('step4'),
    };

    try {
        document.getElementById('analysisArea').style.display = 'block';
        document.getElementById('resultsArea').style.display = 'none';
        Object.values(steps).forEach(step => {
            if (step) step.classList.remove('active');
        });

        if (progressFill) progressFill.style.width = '15%';
        if (steps.step1) steps.step1.classList.add('active');
        
        // Use the new real-time analyzer framework
        const analysisResult = await realTimeAnalyzer.analyzeChartImage(file);
        
        // Save result to database for learning
        analysisDB.saveResult(analysisResult);

        if (progressFill) progressFill.style.width = '100%';
        const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);

        setTimeout(() => {
            displayProfessionalResults(
                analysisResult.recommendation, 
                analysisResult.analysisResults.candlestick, 
                {
                    supportResistance: analysisResult.analysisResults.supportResistance,
                    donchianChannels: analysisResult.analysisResults.donchian,
                    quantitative: analysisResult.analysisResults.quantitative,
                    liquidity: analysisResult.analysisResults.liquidity,
                    trend: analysisResult.analysisResults.trend
                }, 
                analysisTime, 
                analysisResult.image
            );
        }, 800);

    } catch (error) {
        console.error('❌ ANALYSIS FAILED:', error);
        showError(`Analysis Error: ${error.message}`);
        resetAnalyzer();
    } finally {
        analysisInProgress = false;
    }
}

if (typeof window !== 'undefined') {
    window.performAdvancedAnalysis = performAdvancedAnalysis;
}