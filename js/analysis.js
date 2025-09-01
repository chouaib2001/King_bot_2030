// Professional Trading Analysis Engine - Enhanced AI Chart Analyzer v7.0
'use strict';

const config = {
    debug: true,
    candles: {
        scanCount: 150,
        minWidth: 2,
        chartAreaRatio: 0.9,
        greenCandle: (r, g, b) => g > r * 1.3 && g > b * 1.3 && g > 100,
        redCandle: (r, g, b) => r > g * 1.3 && r > b * 1.3 && r > 100,
        dojiBodyRatio: 0.05,
        wickRatio: 2.5
    },
    supportResistance: {
        zoneProximity: 0.015,
        minTouches: 2,
        clusterTolerance: 0.01,
        confirmationCandles: 3
    },
    donchian: {
        periods: [20, 50],
        breakoutThreshold: 0.015
    },
    scores: {
        // Enhanced scoring system for more accurate analysis
        doji: 1.0,
        spinningTop: 1.5,
        hammer: 2.5,
        invertedHammer: 2.0,
        shootingStar: 2.0,
        hangingMan: 2.5,
        bullishEngulfing: 4.0,
        bearishEngulfing: 4.0,
        bullishHarami: 3.0,
        bearishHarami: 3.0,
        piercingLine: 3.5,
        darkCloudCover: 3.5,
        morningStar: 5.0,
        eveningStar: 5.0,
        threeWhiteSoldiers: 4.5,
        threeBlackCrows: 4.5,
        tweezerTop: 2.5,
        tweezerBottom: 2.5,
        risingThree: 3.5,
        fallingThree: 3.5,
        gapUp: 3.0,
        gapDown: 3.0,
        strongSupport: 5.0,
        strongResistance: 5.0,
        upperBreakout: 4.5,
        lowerBreakout: 4.5,
        rsiOversold: 3.0,
        rsiOverbought: 3.0,
        macdBullish: 3.5,
        macdBearish: 3.5
    },
    recommendation: {
        confidenceThreshold: 65,
        profitTargets: {
            conservative: 0.015,
            moderate: 0.03,
            aggressive: 0.045
        },
        riskLevels: {
            conservative: 0.0075,
            moderate: 0.015,
            aggressive: 0.0225
        }
    }
};

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

        if (progressFill) progressFill.style.width = '10%';
        if (steps.step1) steps.step1.classList.add('active');
        const [imageData, img] = await loadImageData(file);

        if (progressFill) progressFill.style.width = '30%';
        if (steps.step2) steps.step2.classList.add('active');
        const candleAnalysis = await analyzeProfessionalCandlesticks(imageData);

        if (progressFill) progressFill.style.width = '60%';
        if (steps.step3) steps.step3.classList.add('active');
        const technicalAnalysis = await performTechnicalAnalysis(candleAnalysis.candles, imageData);

        if (progressFill) progressFill.style.width = '85%';
        if (steps.step4) steps.step4.classList.add('active');
        const recommendation = await generateProfessionalRecommendation(candleAnalysis, technicalAnalysis);

        if (progressFill) progressFill.style.width = '100%';
        const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);

        setTimeout(() => {
            displayProfessionalResults(recommendation, candleAnalysis, technicalAnalysis, analysisTime, img);
        }, 500);

    } catch (error) {
        console.error('❌ ANALYSIS FAILED:', error);
        showError(`Analysis Error: ${error.message}`);
        resetAnalyzer();
    } finally {
        analysisInProgress = false;
    }
}

function loadImageData(file) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true
        });
        const img = new Image();

        img.onload = () => {
            const maxWidth = 1400,
                maxHeight = 900;
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
                reject(new Error('Failed to read image data - possibly CORS issue'));
            }
        };

        img.onerror = () => reject(new Error('Failed to load image - invalid file'));
        img.src = URL.createObjectURL(file);
    });
}

async function analyzeProfessionalCandlesticks(imageData) {
    const {
        data: pixels,
        width,
        height
    } = imageData;
    const cfg = config.candles;
    const chartAreaHeight = height * cfg.chartAreaRatio;

    // Enhanced candle detection with better accuracy
    let candles = [];
    let currentCandle = null;

    // Scan from right to left (most recent candles first)
    for (let x = width - 1; x > 0; x--) {
        let isCandleColumn = false;
        // Scan vertically through the chart area
        for (let y = 0; y < chartAreaHeight; y++) {
            const i = (y * width + x) * 4;
            // Check for green or red candle pixels
            if (cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2]) || 
                cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2])) {
                isCandleColumn = true;
                break;
            }
        }

        if (isCandleColumn) {
            // Start a new candle or extend current one
            if (!currentCandle) {
                currentCandle = {
                    x_end: x,
                    x_start: x
                };
            }
            currentCandle.x_start = x;
        } else {
            // End of candle detected
            if (currentCandle && (currentCandle.x_end - currentCandle.x_start) >= cfg.minWidth) {
                candles.push(currentCandle);
                // Limit number of candles for performance
                if (candles.length >= cfg.scanCount) break;
            }
            currentCandle = null;
        }
    }

    // Handle case where we end with an active candle
    if (currentCandle && (currentCandle.x_end - currentCandle.x_start) >= cfg.minWidth && 
        candles.length < cfg.scanCount) {
        candles.push(currentCandle);
    }

    if (candles.length === 0) {
        throw new Error("No candles detected in chart image - ensure image contains clear candlestick chart");
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

        // Find candle boundaries by scanning vertically
        for (let y = 0; y < chartAreaHeight; y++) {
            const i = (y * width + midX) * 4;
            // Check for candle pixels
            if (cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2]) || 
                cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2])) {
                // Set high on first detection
                if (high === height) high = y;
                // Always update low
                low = y;
            }
        }

        // Determine candle color by counting pixels
        for (let y = high; y <= low; y++) {
            const i = (y * width + midX) * 4;
            if (cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2])) greenPixels++;
            if (cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2])) redPixels++;
        }

        candle.isGreen = greenPixels > redPixels;
        candle.isRed = !candle.isGreen;

        // Find body boundaries more accurately
        let inBody = false;
        for (let y = high; y <= low; y++) {
            const i = (y * width + midX) * 4;
            const isColorMatch = (candle.isGreen && cfg.greenCandle(pixels[i], pixels[i + 1], pixels[i + 2])) ||
                (candle.isRed && cfg.redCandle(pixels[i], pixels[i + 1], pixels[i + 2]));
            
            if (isColorMatch) {
                // Mark body start if not already in body
                if (!inBody) {
                    bodyHigh = y;
                    inBody = true;
                }
                // Always update body end
                bodyLow = y;
            }
        }

        // Calculate candle properties with enhanced precision
        candle.high = high;
        candle.low = low;
        candle.totalHeight = Math.max(1, low - high); // Prevent division by zero
        candle.bodyTop = bodyHigh;
        candle.bodyBottom = bodyLow;
        candle.open = candle.isGreen ? bodyLow : bodyHigh;
        candle.close = candle.isGreen ? bodyHigh : bodyLow;
        candle.bodyHeight = Math.abs(candle.close - candle.open);
        candle.upperWick = (candle.isGreen ? candle.close : candle.open) - candle.high;
        candle.lowerWick = candle.low - (candle.isGreen ? candle.open : candle.close);
        
        // Ratios with protection against division by zero
        candle.bodyRatio = candle.bodyHeight / candle.totalHeight;
        candle.upperWickRatio = candle.upperWick / Math.max(1, candle.totalHeight);
        candle.lowerWickRatio = candle.lowerWick / Math.max(1, candle.totalHeight);
    }

    // Reverse to chronological order (oldest first)
    candles.reverse();
    const validCandles = candles.filter(c => c.totalHeight > 0);

    if (validCandles.length === 0) {
        throw new Error("No valid candles found after processing");
    }

    // Professional pattern detection with enhanced accuracy
    const patterns = detectAllCandlestickPatterns(validCandles);

    return {
        candles: validCandles,
        patterns: patterns,
        mainPattern: patterns[0] || {
            name: 'No Pattern',
            signal: 'HOLD',
            strength: 0
        }
    };
}

// Enhanced candlestick pattern detection with professional accuracy
function detectAllCandlestickPatterns(candles) {
    if (candles.length < 3) return [];

    const patterns = [];
    const len = candles.length;

    // Helper function to check if a candle is a doji
    function isDoji(candle) {
        return candle.bodyRatio < config.candles.dojiBodyRatio;
    }

    // Helper function to check if a candle has a long upper wick
    function hasLongUpperWick(candle) {
        return candle.upperWickRatio > candle.lowerWickRatio * config.candles.wickRatio;
    }

    // Helper function to check if a candle has a long lower wick
    function hasLongLowerWick(candle) {
        return candle.lowerWickRatio > candle.upperWickRatio * config.candles.wickRatio;
    }

    // Get recent candles for analysis
    const c0 = candles[len - 1]; // Latest
    const c1 = len >= 2 ? candles[len - 2] : null; // Previous
    const c2 = len >= 3 ? candles[len - 3] : null; // Two back

    // Single Candle Patterns
    if (c0 && isDoji(c0)) {
        patterns.push({
            name: 'Doji',
            signal: 'HOLD',
            strength: 0.7,
            description: 'Market Indecision - Equal buying and selling pressure'
        });
    }

    if (c0 && c0.bodyRatio < 0.3 && hasLongLowerWick(c0) && c0.lowerWickRatio > 0.5) {
        patterns.push({
            name: 'Hammer',
            signal: 'BUY',
            strength: 0.9,
            description: 'Bullish Reversal - Buyers stepping in at lows'
        });
    }

    if (c0 && c0.bodyRatio < 0.3 && hasLongUpperWick(c0) && c0.upperWickRatio > 0.5) {
        patterns.push({
            name: 'Inverted Hammer',
            signal: 'BUY',
            strength: 0.8,
            description: 'Bullish Reversal - Buyers attempting to push prices higher'
        });
    }

    if (c0 && c0.bodyRatio < 0.3 && hasLongUpperWick(c0) && c0.upperWickRatio > 0.5 && 
        c0.isRed) {
        patterns.push({
            name: 'Shooting Star',
            signal: 'SELL',
            strength: 0.9,
            description: 'Bearish Reversal - Sellers pushing prices down from highs'
        });
    }

    if (c0 && c0.bodyRatio < 0.3 && hasLongLowerWick(c0) && c0.lowerWickRatio > 0.5 && 
        c0.isRed) {
        patterns.push({
            name: 'Hanging Man',
            signal: 'SELL',
            strength: 0.8,
            description: 'Bearish Reversal - Potential selling climax'
        });
    }

    if (c0 && c0.bodyRatio > 0.7 && c0.isGreen) {
        patterns.push({
            name: 'Bullish Marubozu',
            signal: 'BUY',
            strength: 0.8,
            description: 'Strong Bullish Trend - Continuous buying pressure'
        });
    }

    if (c0 && c0.bodyRatio > 0.7 && c0.isRed) {
        patterns.push({
            name: 'Bearish Marubozu',
            signal: 'SELL',
            strength: 0.8,
            description: 'Strong Bearish Trend - Continuous selling pressure'
        });
    }

    // Two Candle Patterns
    if (c0 && c1) {
        // Engulfing patterns
        if (c0.isGreen && c1.isRed && c0.close > c1.open && c0.open < c1.close && 
            c0.bodyHeight > c1.bodyHeight) {
            patterns.push({
                name: 'Bullish Engulfing',
                signal: 'BUY',
                strength: 0.95,
                description: 'Strong Bullish Reversal - Buyers overpower sellers'
            });
        }

        if (c0.isRed && c1.isGreen && c0.close < c1.open && c0.open > c1.close && 
            c0.bodyHeight > c1.bodyHeight) {
            patterns.push({
                name: 'Bearish Engulfing',
                signal: 'SELL',
                strength: 0.95,
                description: 'Strong Bearish Reversal - Sellers overpower buyers'
            });
        }

        // Harami patterns
        if (c1.isRed && c0.isGreen && c0.open > c1.close && c0.close < c1.open) {
            patterns.push({
                name: 'Bullish Harami',
                signal: 'BUY',
                strength: 0.75,
                description: 'Bullish Reversal - Decreasing selling pressure'
            });
        }

        if (c1.isGreen && c0.isRed && c0.open < c1.close && c0.close > c1.open) {
            patterns.push({
                name: 'Bearish Harami',
                signal: 'SELL',
                strength: 0.75,
                description: 'Bearish Reversal - Decreasing buying pressure'
            });
        }

        // Piercing Line and Dark Cloud Cover
        if (c1.isRed && c0.isGreen && c0.open < c1.low && c0.close > (c1.open + c1.close) / 2) {
            patterns.push({
                name: 'Piercing Line',
                signal: 'BUY',
                strength: 0.85,
                description: 'Bullish Reversal - Buyers entering after selling pressure'
            });
        }

        if (c1.isGreen && c0.isRed && c0.open > c1.high && c0.close < (c1.open + c1.close) / 2) {
            patterns.push({
                name: 'Dark Cloud Cover',
                signal: 'SELL',
                strength: 0.85,
                description: 'Bearish Reversal - Sellers entering after buying pressure'
            });
        }

        // Tweezer patterns
        if (Math.abs(c1.high - c0.high) < (c1.high - c1.low) * 0.01 && c1.isGreen && c0.isRed) {
            patterns.push({
                name: 'Tweezer Top',
                signal: 'SELL',
                strength: 0.7,
                description: 'Bearish Reversal - Failed attempt to move higher'
            });
        }

        if (Math.abs(c1.low - c0.low) < (c1.high - c1.low) * 0.01 && c1.isRed && c0.isGreen) {
            patterns.push({
                name: 'Tweezer Bottom',
                signal: 'BUY',
                strength: 0.7,
                description: 'Bullish Reversal - Failed attempt to move lower'
            });
        }
    }

    // Three Candle Patterns
    if (c0 && c1 && c2) {
        // Morning Star and Evening Star
        if (c2.isRed && isDoji(c1) && c0.isGreen && c0.close > c2.open) {
            patterns.push({
                name: 'Morning Star',
                signal: 'BUY',
                strength: 0.98,
                description: 'Powerful Bullish Reversal - Trend change confirmed'
            });
        }

        if (c2.isGreen && isDoji(c1) && c0.isRed && c0.close < c2.open) {
            patterns.push({
                name: 'Evening Star',
                signal: 'SELL',
                strength: 0.98,
                description: 'Powerful Bearish Reversal - Trend change confirmed'
            });
        }

        // Three White Soldiers and Three Black Crows
        if (c2.isGreen && c1.isGreen && c0.isGreen &&
            c1.close > c2.close && c0.close > c1.close &&
            c1.open > c2.open && c0.open > c1.open) {
            patterns.push({
                name: 'Three White Soldiers',
                signal: 'BUY',
                strength: 0.9,
                description: 'Strong Bullish Trend - Continuous upward momentum'
            });
        }

        if (c2.isRed && c1.isRed && c0.isRed &&
            c1.close < c2.close && c0.close < c1.close &&
            c1.open < c2.open && c0.open < c1.open) {
            patterns.push({
                name: 'Three Black Crows',
                signal: 'SELL',
                strength: 0.9,
                description: 'Strong Bearish Trend - Continuous downward momentum'
            });
        }

        // Three Inside Up/Down
        if (c2.isRed && c1.isGreen && c1.open > c2.close && c1.close < c2.open &&
            c0.isGreen && c0.close > c1.close) {
            patterns.push({
                name: 'Three Inside Up',
                signal: 'BUY',
                strength: 0.8,
                description: 'Bullish Continuation - Strengthening bullish trend'
            });
        }

        if (c2.isGreen && c1.isRed && c1.open < c2.close && c1.close > c2.open &&
            c0.isRed && c0.close < c1.close) {
            patterns.push({
                name: 'Three Inside Down',
                signal: 'SELL',
                strength: 0.8,
                description: 'Bearish Continuation - Strengthening bearish trend'
            });
        }

        // Rising Three Methods and Falling Three Methods
        if (c2.isGreen && c1.isRed && c0.isGreen &&
            c1.open < c2.close && c1.close > c0.open &&
            c1.bodyHeight < Math.min(c2.bodyHeight, c0.bodyHeight)) {
            patterns.push({
                name: 'Rising Three Methods',
                signal: 'BUY',
                strength: 0.85,
                description: 'Bullish Continuation - Brief consolidation before continuation'
            });
        }

        if (c2.isRed && c1.isGreen && c0.isRed &&
            c1.open > c2.close && c1.close < c0.open &&
            c1.bodyHeight < Math.min(c2.bodyHeight, c0.bodyHeight)) {
            patterns.push({
                name: 'Falling Three Methods',
                signal: 'SELL',
                strength: 0.85,
                description: 'Bearish Continuation - Brief consolidation before continuation'
            });
        }
    }

    // Gap analysis (requires at least 2 candles)
    if (c0 && c1) {
        // Gap Up
        if (c0.low > c1.high) {
            patterns.push({
                name: 'Gap Up',
                signal: 'BUY',
                strength: 0.7,
                description: 'Bullish Signal - Strong buying interest'
            });
        }

        // Gap Down
        if (c0.high < c1.low) {
            patterns.push({
                name: 'Gap Down',
                signal: 'SELL',
                strength: 0.7,
                description: 'Bearish Signal - Strong selling interest'
            });
        }
    }

    // Sort by strength (highest first)
    return patterns.sort((a, b) => b.strength - a.strength);
}

// Enhanced technical analysis with professional accuracy
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

    // Moving Averages
    const maAnalysis = analyzeMovingAverages(candles);

    // MACD Analysis
    const macdAnalysis = analyzeMACD(candles);

    return {
        supportResistance: srAnalysis,
        donchianChannels: donchianAnalysis,
        quantitative: quantAnalysis,
        movingAverages: maAnalysis,
        macd: macdAnalysis,
        combinedSignal: combineTechnicalSignals(srAnalysis, donchianAnalysis, quantAnalysis, maAnalysis, macdAnalysis)
    };
}

// Enhanced Support/Resistance analysis with professional accuracy
function analyzeSupportResistance(candles, imageHeight) {
    if (candles.length < 8) {
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
        // Weight recent candles more heavily (exponential weighting)
        const weight = 1 + (i / candles.length) * 2;

        points.push({
            y: c.high,
            type: 'resistance',
            index: i,
            weight: weight,
            candle: c
        });
        points.push({
            y: c.low,
            type: 'support',
            index: i,
            weight: weight,
            candle: c
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
        indices: [points[0].index],
        candles: [points[0].candle]
    };

    for (let i = 1; i < points.length; i++) {
        const distance = points[i].y - currentLevel.values[currentLevel.values.length - 1];
        // Dynamic tolerance based on chart height and recent activity
        const dynamicTolerance = imageHeight * cfg.clusterTolerance *
            (1 + (points[i].index / candles.length) * 0.5);

        if (distance < dynamicTolerance) {
            currentLevel.sum += points[i].y * points[i].weight;
            currentLevel.weightedSum += points[i].weight;
            currentLevel.touches++;
            currentLevel.values.push(points[i].y);
            currentLevel.indices.push(points[i].index);
            currentLevel.candles.push(points[i].candle);
        } else {
            if (currentLevel.touches >= cfg.minTouches) {
                const weightedAverage = currentLevel.sum / currentLevel.weightedSum;
                levels.push({
                    level: Math.round(weightedAverage),
                    touches: currentLevel.touches,
                    strength: Math.min(currentLevel.touches / 6, 1) *
                        (currentLevel.weightedSum / currentLevel.touches / 2),
                    indices: currentLevel.indices,
                    candles: currentLevel.candles
                });
            }
            currentLevel = {
                sum: points[i].y * points[i].weight,
                weightedSum: points[i].weight,
                touches: 1,
                values: [points[i].y],
                type: points[i].type,
                indices: [points[i].index],
                candles: [points[i].candle]
            };
        }
    }

    if (currentLevel.touches >= cfg.minTouches) {
        const weightedAverage = currentLevel.sum / currentLevel.weightedSum;
        levels.push({
            level: Math.round(weightedAverage),
            touches: currentLevel.touches,
            strength: Math.min(currentLevel.touches / 6, 1) *
                (currentLevel.weightedSum / currentLevel.touches / 2),
            indices: currentLevel.indices,
            candles: currentLevel.candles
        });
    }

    // Separate supports and resistances based on current price
    const lastCandle = candles[candles.length - 1];
    const currentPrice = lastCandle.close;

    // Enhanced level validation - remove weak levels that are too close to stronger ones
    const validatedLevels = levels.filter(level => {
        const isStrongerLevelExists = levels.some(otherLevel =>
            otherLevel !== level &&
            otherLevel.strength > level.strength * 1.2 &&
            Math.abs(otherLevel.level - level.level) < imageHeight * cfg.clusterTolerance * 3
        );
        return !isStrongerLevelExists;
    });

    // Sort and separate supports and resistances
    const supports = validatedLevels
        .filter(l => l.level > currentPrice)
        .sort((a, b) => a.level - b.level);
    const resistances = validatedLevels
        .filter(l => l.level < currentPrice)
        .sort((a, b) => b.level - a.level);

    let signal = 'HOLD',
        strength = 0;
    const nearestSupport = supports[0];
    const nearestResistance = resistances[0];

    // Enhanced proximity detection with dynamic zones
    const supportZone = nearestSupport ?
        imageHeight * cfg.zoneProximity * (1 + (nearestSupport.strength * 0.7)) : 0;
    const resistanceZone = nearestResistance ?
        imageHeight * cfg.zoneProximity * (1 + (nearestResistance.strength * 0.7)) : 0;

    // Check for recent confirmation candles
    let supportConfirmed = false;
    let resistanceConfirmed = false;
    
    if (candles.length >= cfg.confirmationCandles + 1) {
        const recentCandles = candles.slice(-cfg.confirmationCandles - 1, -1);
        supportConfirmed = recentCandles.some(c => 
            nearestSupport && Math.abs(c.low - nearestSupport.level) < supportZone * 0.5);
        resistanceConfirmed = recentCandles.some(c => 
            nearestResistance && Math.abs(c.high - nearestResistance.level) < resistanceZone * 0.5);
    }

    if (nearestResistance && Math.abs(currentPrice - nearestResistance.level) < resistanceZone && resistanceConfirmed) {
        signal = 'SELL';
        strength = Math.min(nearestResistance.strength * 1.2, 1);
    } else if (nearestSupport && Math.abs(currentPrice - nearestSupport.level) < supportZone && supportConfirmed) {
        signal = 'BUY';
        strength = Math.min(nearestSupport.strength * 1.2, 1);
    }

    return {
        supports,
        resistances,
        signal,
        strength,
        levels: validatedLevels
    };
}

// Enhanced Donchian Channels Analysis
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

            // Enhanced breakout detection with confirmation
            const breakoutThreshold = (highest - lowest) * config.donchian.breakoutThreshold;
            
            if (currentPrice > highest - breakoutThreshold) {
                // Check for confirmation (price sustained above channel)
                let confirmed = true;
                if (candles.length >= 3) {
                    const recent = candles.slice(-3);
                    confirmed = recent.every(c => c.close > highest - breakoutThreshold);
                }
                
                if (confirmed) {
                    signal = 'BUY';
                    strength = 0.9;
                    position = 'upper_breakout';
                }
            } else if (currentPrice < lowest + breakoutThreshold) {
                // Check for confirmation (price sustained below channel)
                let confirmed = true;
                if (candles.length >= 3) {
                    const recent = candles.slice(-3);
                    confirmed = recent.every(c => c.close < lowest + breakoutThreshold);
                }
                
                if (confirmed) {
                    signal = 'SELL';
                    strength = 0.9;
                    position = 'lower_breakout';
                }
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

// Enhanced Moving Averages Analysis
function analyzeMovingAverages(candles) {
    if (candles.length < 50) return {
        signal: 'HOLD',
        strength: 0
    };

    // Calculate multiple moving averages
    const sma9 = calculateSMA(candles, 9);
    const sma20 = calculateSMA(candles, 20);
    const sma50 = calculateSMA(candles, 50);
    const ema9 = calculateEMA(candles, 9);
    const ema20 = calculateEMA(candles, 20);
    const ema50 = calculateEMA(candles, 50);

    let signal = 'HOLD';
    let strength = 0;

    // Golden Cross (SMA20 crosses above SMA50)
    if (sma20 && sma50 && sma9) {
        const prevCandles = candles.slice(-2, -1);
        if (prevCandles.length > 0) {
            const prevSma9 = calculateSMA(candles.slice(0, -1), 9);
            const prevSma20 = calculateSMA(candles.slice(0, -1), 20);
            const prevSma50 = calculateSMA(candles.slice(0, -1), 50);
            
            if (prevSma20 && prevSma50 && prevSma9) {
                // Current golden cross
                if (sma20 > sma50 && prevSma20 <= prevSma50) {
                    signal = 'BUY';
                    strength = 0.85;
                }
                // Current death cross
                else if (sma20 < sma50 && prevSma20 >= prevSma50) {
                    signal = 'SELL';
                    strength = 0.85;
                }
                // Bullish alignment
                else if (sma9 > sma20 && sma20 > sma50) {
                    signal = 'BUY';
                    strength = 0.7;
                }
                // Bearish alignment
                else if (sma9 < sma20 && sma20 < sma50) {
                    signal = 'SELL';
                    strength = 0.7;
                }
            }
        }
    }

    return {
        signal,
        strength,
        indicators: {
            sma9,
            sma20,
            sma50,
            ema9,
            ema20,
            ema50
        }
    };
}

// Enhanced MACD Analysis
function analyzeMACD(candles) {
    if (candles.length < 26) return {
        signal: 'HOLD',
        strength: 0
    };

    // Calculate MACD components
    const ema12 = calculateEMA(candles, 12);
    const ema26 = calculateEMA(candles, 26);
    
    if (!ema12 || !ema26) return {
        signal: 'HOLD',
        strength: 0
    };

    const macdLine = ema12 - ema26;
    
    // Calculate signal line (9-period EMA of MACD line)
    const macdValues = [];
    for (let i = 0; i < Math.min(9, candles.length); i++) {
        const slice = candles.slice(0, candles.length - i);
        const e12 = calculateEMA(slice, 12);
        const e26 = calculateEMA(slice, 26);
        if (e12 && e26) {
            macdValues.unshift(e12 - e26);
        }
    }
    
    const signalLine = macdValues.length > 0 ? 
        macdValues.reduce((a, b) => a + b, 0) / macdValues.length : 0;
    
    const histogram = macdLine - signalLine;

    let signal = 'HOLD';
    let strength = 0;

    // MACD crossover signals
    if (macdLine > 0 && histogram > 0) {
        signal = 'BUY';
        strength = Math.min(Math.abs(histogram) * 10, 1);
    } else if (macdLine < 0 && histogram < 0) {
        signal = 'SELL';
        strength = Math.min(Math.abs(histogram) * 10, 1);
    }

    // Enhanced signal with histogram divergence
    if (candles.length >= 3) {
        const prevCandles = candles.slice(-3, -1);
        const prevMacdValues = prevCandles.map((c, i) => {
            const slice = candles.slice(0, candles.length - 2 + i);
            const e12 = calculateEMA(slice, 12);
            const e26 = calculateEMA(slice, 26);
            return e12 && e26 ? e12 - e26 : 0;
        });
        
        const prevHistogram = prevMacdValues.length > 0 ? 
            prevMacdValues[prevMacdValues.length - 1] - 
            (prevMacdValues.reduce((a, b) => a + b, 0) / prevMacdValues.length) : 0;
            
        // Bullish divergence
        if (histogram > prevHistogram && signal === 'BUY') {
            strength = Math.min(strength * 1.3, 1);
        }
        // Bearish divergence
        else if (histogram < prevHistogram && signal === 'SELL') {
            strength = Math.min(strength * 1.3, 1);
        }
    }

    return {
        signal,
        strength,
        indicators: {
            macdLine,
            signalLine,
            histogram
        }
    };
}

// Enhanced signal combination with professional weighting
function combineTechnicalSignals(srAnalysis, donchianAnalysis, quantAnalysis, maAnalysis, macdAnalysis) {
    const signals = [
        {
            signal: srAnalysis.signal,
            strength: srAnalysis.strength * 1.2 // Weight S/R more heavily
        },
        {
            signal: donchianAnalysis.signal,
            strength: donchianAnalysis.strength
        },
        {
            signal: maAnalysis.signal,
            strength: maAnalysis.strength * 0.9
        },
        {
            signal: macdAnalysis.signal,
            strength: macdAnalysis.strength
        }
    ];

    // Add quantitative analysis signal if available
    if (quantAnalysis && quantAnalysis.signal) {
        signals.push({
            signal: quantAnalysis.signal,
            strength: (quantAnalysis.strength || 0.5) * 0.8
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
        confidence: Math.min(98, (buyScore / totalScore) * 100)
    } : {
        signal: 'SELL',
        confidence: Math.min(98, (sellScore / totalScore) * 100)
    };
}

// Enhanced Quantitative Analysis Function
function performQuantitativeAnalysis(candles) {
    if (candles.length < 14) return null;

    // Calculate price changes
    const priceChanges = [];
    for (let i = 1; i < candles.length; i++) {
        priceChanges.push(candles[i].close - candles[i - 1].close);
    }

    // Calculate simple moving averages
    const sma9 = calculateSMA(candles, 9);
    const sma20 = calculateSMA(candles, 20);
    const sma50 = calculateSMA(candles, 50);

    // Calculate exponential moving averages
    const ema9 = calculateEMA(candles, 9);
    const ema20 = calculateEMA(candles, 20);
    const ema50 = calculateEMA(candles, 50);

    // Calculate RSI
    const rsi = calculateRSI(candles, 14);

    // Calculate volatility
    const volatility = calculateVolatility(candles, 14);

    // Calculate trend strength
    const trendStrength = calculateTrendStrength(candles);

    // Calculate momentum
    const momentum = calculateMomentum(candles);

    // Generate signals based on quantitative indicators
    let signal = 'HOLD';
    let strength = 0;

    // RSI signal with enhanced thresholds
    if (rsi > 75) {
        signal = 'SELL';
        strength = Math.min((rsi - 75) / 25, 1) * 0.9;
    } else if (rsi < 25) {
        signal = 'BUY';
        strength = Math.min((25 - rsi) / 25, 1) * 0.9;
    }

    // Moving average crossover signal with enhanced logic
    if (sma9 && sma20 && sma50) {
        const maDiff = (sma9 - sma20) / sma20;
        if (maDiff > 0.005) { // 0.5% threshold
            const newSignal = 'BUY';
            const newStrength = Math.min(maDiff * 100, 1) * 0.7;
            if (newStrength > strength) {
                signal = newSignal;
                strength = newStrength;
            }
        } else if (maDiff < -0.005) {
            const newSignal = 'SELL';
            const newStrength = Math.min(Math.abs(maDiff) * 100, 1) * 0.7;
            if (newStrength > strength) {
                signal = newSignal;
                strength = newStrength;
            }
        }
    }

    // Volatility adjustment
    if (volatility > 0.03) { // 3% volatility threshold
        strength *= 0.7; // Reduce confidence in high volatility
    }

    return {
        signal: signal,
        strength: strength,
        indicators: {
            rsi: rsi,
            sma9: sma9,
            sma20: sma20,
            sma50: sma50,
            ema9: ema9,
            ema20: ema20,
            ema50: ema50,
            volatility: volatility,
            trendStrength: trendStrength,
            momentum: momentum
        }
    };
}

// Enhanced helper functions for quantitative analysis
function calculateSMA(candles, period) {
    if (candles.length < period) return null;

    const sum = candles.slice(-period)
        .reduce((acc, candle) => acc + candle.close, 0);
    return sum / period;
}

function calculateEMA(candles, period) {
    if (candles.length < period) return null;

    const k = 2 / (period + 1);
    let ema = candles[0].close;
    
    for (let i = 1; i < candles.length; i++) {
        ema = candles[i].close * k + ema * (1 - k);
    }
    
    return ema;
}

function calculateRSI(candles, period) {
    if (candles.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = candles.length - period; i < candles.length; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change > 0) {
            gains += change;
        } else {
            losses -= change;
        }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateVolatility(candles, period) {
    if (candles.length <= period) return 0;

    const closes = candles.slice(-period).map(c => c.close);
    const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
    const squareDiffs = closes.map(value => {
        const diff = value - mean;
        const sqrDiff = diff * diff;
        return sqrDiff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    return stdDev / mean; // Coefficient of variation
}

function calculateTrendStrength(candles) {
    if (candles.length < 10) return 0;

    const recentCandles = candles.slice(-10);
    let upDays = 0;
    let downDays = 0;

    for (let i = 1; i < recentCandles.length; i++) {
        if (recentCandles[i].close > recentCandles[i - 1].close) {
            upDays++;
        } else if (recentCandles[i].close < recentCandles[i - 1].close) {
            downDays++;
        }
    }

    return (upDays - downDays) / 10;
}

function calculateMomentum(candles) {
    if (candles.length < 10) return 0;

    const currentPrice = candles[candles.length - 1].close;
    const price10DaysAgo = candles[candles.length - 10].close;

    return (currentPrice - price10DaysAgo) / price10DaysAgo;
}

// Enhanced professional recommendation generator
async function generateProfessionalRecommendation(candleAnalysis, technicalAnalysis) {
    let buyScore = 0,
        sellScore = 0;
    const summary = [];

    // Score candlestick patterns with enhanced weighting
    candleAnalysis.patterns.forEach(pattern => {
        const baseScore = config.scores[pattern.name.replace(/\s/g, '')] || 2.0;
        const score = baseScore * pattern.strength;
        if (pattern.signal === 'BUY') {
            buyScore += score;
            summary.push({
                type: 'bullish',
                text: `🕯️ ${pattern.name}: ${pattern.description} (+${score.toFixed(1)})`,
                impact: score
            });
        } else if (pattern.signal === 'SELL') {
            sellScore += score;
            summary.push({
                type: 'bearish',
                text: `🕯️ ${pattern.name}: ${pattern.description} (+${score.toFixed(1)})`,
                impact: score
            });
        }
    });

    // Score support/resistance analysis
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

    // Score Donchian Channels
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

    // Score Moving Averages
    const maSignal = technicalAnalysis.movingAverages;
    if (maSignal.signal === 'BUY') {
        const score = 3.5 * maSignal.strength;
        buyScore += score;
        summary.push({
            type: 'bullish',
            text: `📊 Moving Average Bullish Signal (+${score.toFixed(1)})`,
            impact: score
        });
    } else if (maSignal.signal === 'SELL') {
        const score = 3.5 * maSignal.strength;
        sellScore += score;
        summary.push({
            type: 'bearish',
            text: `📊 Moving Average Bearish Signal (+${score.toFixed(1)})`,
            impact: score
        });
    }

    // Score MACD
    const macdSignal = technicalAnalysis.macd;
    if (macdSignal.signal === 'BUY') {
        const score = config.scores.macdBullish * macdSignal.strength;
        buyScore += score;
        summary.push({
            type: 'bullish',
            text: `📶 MACD Bullish Signal (+${score.toFixed(1)})`,
            impact: score
        });
    } else if (macdSignal.signal === 'SELL') {
        const score = config.scores.macdBearish * macdSignal.strength;
        sellScore += score;
        summary.push({
            type: 'bearish',
            text: `📶 MACD Bearish Signal (+${score.toFixed(1)})`,
            impact: score
        });
    }

    // Score Quantitative Analysis
    const quantSignal = technicalAnalysis.quantitative;
    if (quantSignal && quantSignal.signal !== 'HOLD') {
        const score = 3.0 * quantSignal.strength;
        if (quantSignal.signal === 'BUY') {
            buyScore += score;
            summary.push({
                type: 'bullish',
                text: `🔬 Quantitative Analysis: BUY (+${score.toFixed(1)})`,
                impact: score
            });
        } else if (quantSignal.signal === 'SELL') {
            sellScore += score;
            summary.push({
                type: 'bearish',
                text: `🔬 Quantitative Analysis: SELL (+${score.toFixed(1)})`,
                impact: score
            });
        }
    }

    // Calculate final recommendation
    const totalScore = buyScore + sellScore;
    const scoreDifference = Math.abs(buyScore - sellScore);

    let action, confidence, profitTarget, riskLevel, color;

    if (totalScore === 0 || scoreDifference < 1.5) {
        action = 'WAIT';
        confidence = 40;
        profitTarget = 0;
        riskLevel = 0;
        color = 'var(--text-muted)';
    } else {
        const rawConfidence = 50 + (scoreDifference / totalScore) * 50;
        confidence = Math.min(95, Math.round(rawConfidence));

        if (buyScore > sellScore) {
            action = 'BUY';
            color = 'var(--success-green)';

            // Calculate profit targets based on confidence and quantitative indicators
            if (confidence >= 85) {
                profitTarget = config.recommendation.profitTargets.aggressive;
                riskLevel = config.recommendation.riskLevels.aggressive;
            } else if (confidence >= 75) {
                profitTarget = config.recommendation.profitTargets.moderate;
                riskLevel = config.recommendation.riskLevels.moderate;
            } else {
                profitTarget = config.recommendation.profitTargets.conservative;
                riskLevel = config.recommendation.riskLevels.conservative;
            }
        } else {
            action = 'SELL';
            color = 'var(--danger-red)';

            // Calculate profit targets for short positions
            if (confidence >= 85) {
                profitTarget = config.recommendation.profitTargets.aggressive;
                riskLevel = config.recommendation.riskLevels.aggressive;
            } else if (confidence >= 75) {
                profitTarget = config.recommendation.profitTargets.moderate;
                riskLevel = config.recommendation.riskLevels.moderate;
            } else {
                profitTarget = config.recommendation.profitTargets.conservative;
                riskLevel = config.recommendation.riskLevels.conservative;
            }
        }
    }

    // Apply 65% confidence threshold as requested by user
    if (confidence < 65) {
        action = 'WAIT';
        profitTarget = 0;
        riskLevel = 0;
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
            if (quantData.indicators.volatility > 0.04) {
                profitTarget *= 0.6; // 40% reduction for very high volatility
            } else if (quantData.indicators.volatility > 0.03) {
                profitTarget *= 0.75; // 25% reduction for high volatility
            } else if (quantData.indicators.volatility > 0.02) {
                profitTarget *= 0.9; // 10% reduction for medium volatility
            }

            // Increase profit target in strong trends
            if (Math.abs(quantData.indicators.trendStrength) > 0.6) {
                profitTarget *= 1.25; // 25% increase for very strong trends
            } else if (Math.abs(quantData.indicators.trendStrength) > 0.4) {
                profitTarget *= 1.15; // 15% increase for strong trends
            }

            // Adjust based on RSI (overbought/oversold conditions)
            if (quantData.indicators.rsi > 85 || quantData.indicators.rsi < 15) {
                profitTarget *= 0.85; // Conservative adjustment for extreme RSI
            }
        }

        // Adjust based on moving average alignment
        const maData = technicalAnalysis.movingAverages;
        if (maData && maData.indicators) {
            const { sma9, sma20, sma50 } = maData.indicators;
            if (sma9 && sma20 && sma50) {
                // All moving averages aligned with the signal
                if (action === 'BUY' && sma9 > sma20 && sma20 > sma50) {
                    profitTarget *= 1.1; // 10% boost for strong bullish alignment
                } else if (action === 'SELL' && sma9 < sma20 && sma20 < sma50) {
                    profitTarget *= 1.1; // 10% boost for strong bearish alignment
                }
                // Moving averages misaligned with signal
                else if ((action === 'BUY' && (sma9 < sma20 || sma20 < sma50)) ||
                         (action === 'SELL' && (sma9 > sma20 || sma20 > sma50))) {
                    profitTarget *= 0.85; // 15% reduction for misalignment
                }
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
        summary: summary.sort((a, b) => b.impact - a.impact).slice(0, 10), // Top 10 factors
        scores: {
            buy: buyScore.toFixed(1),
            sell: sellScore.toFixed(1)
        }
    };
}

// Enhanced results display with professional visualization
function displayProfessionalResults(recommendation, candleAnalysis, technicalAnalysis, analysisTime, img) {
    document.getElementById('analysisArea').style.display = 'none';
    document.getElementById('resultsArea').style.display = 'block';

    const el = (id) => document.getElementById(id);

    // Enhanced visual analysis with S/R and Donchian overlay
    const canvas = el('visualAnalysisCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Draw Support/Resistance levels with enhanced visualization
    ctx.lineWidth = 2;
    ctx.font = "12px Orbitron";
    ctx.textBaseline = 'bottom';

    const srAnalysis = technicalAnalysis.supportResistance;

    // Draw resistance levels with enhanced styling
    if (srAnalysis.resistances && srAnalysis.resistances.length > 0) {
        srAnalysis.resistances.slice(0, 4).forEach((level, i) => {
            const alpha = 0.9 - i * 0.15;
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.textAlign = "left";
            ctx.beginPath();
            ctx.moveTo(0, level.level);
            ctx.lineTo(canvas.width, level.level);
            ctx.stroke();
            ctx.fillText(`Resistance (${level.touches} touches)`, 10, level.level - 5);
        });
    }

    // Draw support levels with enhanced styling
    if (srAnalysis.supports && srAnalysis.supports.length > 0) {
        srAnalysis.supports.slice(0, 4).forEach((level, i) => {
            const alpha = 0.9 - i * 0.15;
            ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.textAlign = "left";
            ctx.beginPath();
            ctx.moveTo(0, level.level);
            ctx.lineTo(canvas.width, level.level);
            ctx.stroke();
            ctx.fillText(`Support (${level.touches} touches)`, 10, level.level + 15);
        });
    }

    // Draw Donchian Channels if available
    const donchianData = technicalAnalysis.donchianChannels.allPeriods;
    if (donchianData && donchianData.length > 0) {
        const primary = donchianData[0]; // Use primary period

        // Upper channel with enhanced styling
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)';
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, primary.highest);
        ctx.lineTo(canvas.width, primary.highest);
        ctx.stroke();

        // Lower channel with enhanced styling
        ctx.beginPath();
        ctx.moveTo(0, primary.lowest);
        ctx.lineTo(canvas.width, primary.lowest);
        ctx.stroke();

        // Middle line with enhanced styling
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, primary.middle);
        ctx.lineTo(canvas.width, primary.middle);
        ctx.stroke();

        ctx.setLineDash([]); // Reset line dash
        ctx.lineWidth = 2;

        // Labels with enhanced positioning
        ctx.fillStyle = 'rgba(139, 92, 246, 1)';
        ctx.fillText(`Donchian ${primary.period} High`, canvas.width - 150, primary.highest - 5);
        ctx.fillText(`Donchian ${primary.period} Low`, canvas.width - 150, primary.lowest + 15);
    }

    // Draw Moving Averages if available
    const maData = technicalAnalysis.movingAverages.indicators;
    if (maData) {
        const { sma9, sma20, sma50 } = maData;
        if (sma9) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, sma9);
            ctx.lineTo(canvas.width, sma9);
            ctx.stroke();
            ctx.fillText('SMA 9', 10, sma9 - 5);
        }
        if (sma20) {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, sma20);
            ctx.lineTo(canvas.width, sma20);
            ctx.stroke();
            ctx.fillText('SMA 20', 10, sma20 - 5);
        }
        if (sma50) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, sma50);
            ctx.lineTo(canvas.width, sma50);
            ctx.stroke();
            ctx.fillText('SMA 50', 10, sma50 - 5);
        }
    }

    // Display recommendation with professional formatting
    const actionText = recommendation.action === 'BUY' ? '🔵 BUY' :
        recommendation.action === 'SELL' ? '🔴 SELL' : '⏸️ WAIT';

    el('recommendation').textContent = actionText;
    el('recommendation').style.color = recommendation.color;
    el('confidence').textContent = `Confidence: ${recommendation.confidence}%`;

    // Enhanced strength display with profit targets
    if (recommendation.action !== 'WAIT' && recommendation.profitTarget > 0) {
        el('strength').innerHTML = `
            <div>Expected Profit: <span style="color: var(--success-green);">${recommendation.profitTarget}%</span></div>
            <div>Risk Level: <span style="color: var(--danger-red);">${recommendation.riskLevel}%</span></div>
        `;
    } else {
        el('strength').innerHTML = `
            <div style="color: var(--text-muted);">Market conditions unclear</div>
            <div style="color: var(--text-muted);">Wait for better setup</div>
        `;
    }

    // Pattern analysis display
    const mainPattern = candleAnalysis.patterns[0];
    el('candlePattern').textContent = mainPattern ? mainPattern.name : 'No Significant Pattern';

    // Technical analysis display
    const srText = srAnalysis.signal === 'HOLD' ?
        'Price between support and resistance' :
        `Price near ${srAnalysis.signal === 'BUY' ? 'support' : 'resistance'} level`;
    el('srValue').textContent = srText;

    // Enhanced quantitative analysis display
    const quantData = technicalAnalysis.quantitative;
    const maData2 = technicalAnalysis.movingAverages;
    const macdData = technicalAnalysis.macd;
    
    // Clear existing detail cards
    const detailsContainer = el('analysisDetailsContainer');
    detailsContainer.innerHTML = '';

    // Create enhanced detail cards
    if (quantData && quantData.indicators) {
        const quantContainer = document.createElement('div');
        quantContainer.className = 'detail-card';
        quantContainer.innerHTML = `
            <div class="detail-title">Quantitative Indicators</div>
            <div class="detail-value">
                RSI: ${quantData.indicators.rsi ? quantData.indicators.rsi.toFixed(1) : 'N/A'}<br>
                Volatility: ${(quantData.indicators.volatility * 100).toFixed(2)}%<br>
                Trend: ${quantData.indicators.trendStrength ? 
                    (quantData.indicators.trendStrength > 0.3 ? 'Bullish' : 
                     quantData.indicators.trendStrength < -0.3 ? 'Bearish' : 'Neutral') : 'Neutral'}
            </div>
        `;
        detailsContainer.appendChild(quantContainer);
    }

    if (maData2 && maData2.indicators) {
        const maContainer = document.createElement('div');
        maContainer.className = 'detail-card';
        maContainer.innerHTML = `
            <div class="detail-title">Moving Averages</div>
            <div class="detail-value">
                SMA 9: ${maData2.indicators.sma9 ? maData2.indicators.sma9.toFixed(2) : 'N/A'}<br>
                SMA 20: ${maData2.indicators.sma20 ? maData2.indicators.sma20.toFixed(2) : 'N/A'}<br>
                SMA 50: ${maData2.indicators.sma50 ? maData2.indicators.sma50.toFixed(2) : 'N/A'}
            </div>
        `;
        detailsContainer.appendChild(maContainer);
    }

    if (macdData && macdData.indicators) {
        const macdContainer = document.createElement('div');
        macdContainer.className = 'detail-card';
        macdContainer.innerHTML = `
            <div class="detail-title">MACD Analysis</div>
            <div class="detail-value">
                MACD: ${macdData.indicators.macdLine ? macdData.indicators.macdLine.toFixed(3) : 'N/A'}<br>
                Signal: ${macdData.indicators.signalLine ? macdData.indicators.signalLine.toFixed(3) : 'N/A'}<br>
                Histogram: ${macdData.indicators.histogram ? macdData.indicators.histogram.toFixed(3) : 'N/A'}
            </div>
        `;
        detailsContainer.appendChild(macdContainer);
    }

    if (config.debug) {
        console.log('🏆 PROFESSIONAL ANALYSIS COMPLETE');
        console.log('Final Recommendation:', recommendation);
        console.log('Candlestick Analysis:', candleAnalysis);
        console.log('Technical Analysis:', technicalAnalysis);
    }

    startResultsCountdown();
}

function startResultsCountdown() {
    let countdown = 3; // Changed from 5 to 3 seconds as requested
    const resultsArea = document.getElementById('resultsArea');
    if (!resultsArea) return;

    const oldCountdown = document.querySelector('.countdown-overlay');
    if (oldCountdown) oldCountdown.remove();

    const countdownOverlay = document.createElement('div');
    countdownOverlay.className = 'countdown-overlay';
    countdownOverlay.innerHTML = `
        <div class="countdown-text">
            <div>Analysis will reset in</div>
            <div class="countdown-number" id="countdownNumber">${countdown}</div>
            <div>seconds</div>
        </div>
    `;
    setTimeout(() => {
        resultsArea.style.position = 'relative';
        resultsArea.appendChild(countdownOverlay);
        const countdownInterval = setInterval(() => {
            countdown--;
            const countdownNumberEl = document.getElementById('countdownNumber');
            if (countdownNumberEl) countdownNumberEl.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                resultsArea.classList.add('fade-out');
                setTimeout(() => {
                    resetAnalyzer();
                    clearImageData();
                }, 1000);
            }
        }, 1000);
    }, 1000);
}

if (typeof window !== 'undefined') {
    window.performAdvancedAnalysis = performAdvancedAnalysis;
}