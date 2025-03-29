import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import { Box, Typography, CircularProgress, Tabs, Tab } from '@mui/material';

// 高级图表组件，结合订单簿和交易数据进行订单流分析
const PriceChart = ({ 
  data = [], 
  instrument = 'BTC-USDT',
  depth = { bids: [], asks: [] }  // 添加订单簿数据
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const priceSeries = useRef(null);
  const volumeSeries = useRef(null);
  const cvdSeries = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastPrice, setLastPrice] = useState(null);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('price'); // 'price', 'orderflow', 'depth'
  
  // 格式化交易对名称
  const formattedInstrument = instrument || 'No Data';

  // 从props中提取交易数据
  const tradeData = useMemo(() => {
    try {
      console.log("Raw trade data:", JSON.stringify(data).substring(0, 100) + "...");
      if (!Array.isArray(data)) return [];
      
      // 为了调试，创建一些模拟数据点
      if (data.length === 0) {
        console.log("No data, creating mock data");
        const mockData = [];
        const now = Math.floor(Date.now() / 1000);
        
        for (let i = 0; i < 50; i++) {
          // 创建模拟价格，从19000到21000之间随机波动
          const price = 20000 + Math.random() * 2000 - 1000;
          const quantity = Math.random() * 2;
          mockData.push({
            price: price.toFixed(2),
            quantity: quantity.toFixed(4),
            timestamp: now - (50 - i) * 60, // 每分钟一个点
            is_buyer_maker: Math.random() > 0.5
          });
        }
        return mockData.map((item, index) => ({
          ...item,
          price: parseFloat(item.price),
          quantity: parseFloat(item.quantity),
          index: index // 添加索引以供图表使用
        }));
      }
      
      // 处理真实数据
      const validData = data
        .slice(0, 150)
        .filter(item => item && typeof item === 'object')
        .map((trade, index) => ({
          ...trade,
          price: parseFloat(trade.price || 0),
          quantity: parseFloat(trade.quantity || 0),
          timestamp: trade.timestamp 
            ? Math.floor(trade.timestamp / 1000) 
            : Math.floor(Date.now() / 1000) - (data.length - index) * 60,
          index: index // 添加索引以供图表使用
        }))
        .filter(trade => !isNaN(trade.price) && trade.price > 0);
      
      console.log("First data point:", validData.length > 0 ? JSON.stringify(validData[0]) : "none");
      console.log("Last data point:", validData.length > 0 ? JSON.stringify(validData[validData.length-1]) : "none");
      return validData;
    } catch (err) {
      console.error("Error processing trade data:", err);
      return [];
    }
  }, [data]);
  
  // 计算累积成交量差额(CVD)
  const calculateCVD = useMemo(() => {
    try {
      if (!Array.isArray(tradeData) || tradeData.length === 0) return [];
      
      let cumulativeDelta = 0;
      const result = [];
      
      for (let i = 0; i < tradeData.length; i++) {
        const trade = tradeData[i];
        if (!trade) continue;
        
        // 判断是买单还是卖单
        const isBuyOrder = !(trade.is_buyer_maker || false);
        const volume = trade.quantity || 0;
        if (volume <= 0) continue;
        
        // 买单加，卖单减
        cumulativeDelta += isBuyOrder ? volume : -volume;
        
        result.push({
          time: trade.index, // 使用索引作为时间戳
          value: cumulativeDelta
        });
      }
      
      return result;
    } catch (err) {
      console.error("Error calculating CVD:", err);
      return [];
    }
  }, [tradeData]);

  // 绘制订单簿深度 - 使用useCallback以便添加到依赖项
  const drawOrderBookDepth = useCallback(() => {
    try {
      if (!chartRef.current || !priceSeries.current) return;
      
      // 清除现有的价格线
      const existingPriceLines = priceSeries.current.priceLines();
      existingPriceLines.forEach(line => {
        try {
          priceSeries.current.removePriceLine(line);
        } catch (err) {
          console.error("Error removing price line:", err);
        }
      });
      
      // 处理订单簿数据
      if (!depth || !depth.bids || !depth.asks) return;
      
      const bids = Array.isArray(depth.bids) ? depth.bids.filter(bid => bid) : [];
      const asks = Array.isArray(depth.asks) ? depth.asks.filter(ask => ask) : [];
      
      if (bids.length === 0 && asks.length === 0) return;
      
      console.log("Drawing orderbook depth, bids:", bids.length, "asks:", asks.length);
      
      // 添加卖单阻力位
      asks.slice(0, 5).forEach((ask, index) => {
        const price = parseFloat(ask.price || 0);
        const quantity = parseFloat(ask.quantity || 0);
        if (isNaN(price) || price <= 0) return;
        
        try {
          priceSeries.current.createPriceLine({
            price: price,
            color: 'rgba(244, 67, 54, 0.5)',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `Sell ${quantity.toFixed(4)}`,
          });
        } catch (err) {
          console.error("Error creating ask price line:", err);
        }
      });
      
      // 添加买单支撑位
      bids.slice(0, 5).forEach((bid, index) => {
        const price = parseFloat(bid.price || 0);
        const quantity = parseFloat(bid.quantity || 0);
        if (isNaN(price) || price <= 0) return;
        
        try {
          priceSeries.current.createPriceLine({
            price: price,
            color: 'rgba(76, 175, 80, 0.5)',
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: true,
            title: `Buy ${quantity.toFixed(4)}`,
          });
        } catch (err) {
          console.error("Error creating bid price line:", err);
        }
      });
    } catch (err) {
      console.error("Error drawing order book depth:", err);
    }
  }, [depth]);

  // 处理图表类型切换
  const handleChartTypeChange = (event, newValue) => {
    try {
      setChartType(newValue);
      
      // 根据选择的图表类型调整图表显示
      if (chartRef.current) {
        if (newValue === 'price') {
          // 价格模式
          if (priceSeries.current) priceSeries.current.applyOptions({ visible: true });
          if (volumeSeries.current) volumeSeries.current.applyOptions({ visible: true });
          if (cvdSeries.current) cvdSeries.current.applyOptions({ visible: false });
        } 
        else if (newValue === 'orderflow') {
          // 订单流模式
          if (priceSeries.current) priceSeries.current.applyOptions({ visible: true });
          if (volumeSeries.current) volumeSeries.current.applyOptions({ visible: false });
          if (cvdSeries.current) cvdSeries.current.applyOptions({ visible: true });
        }
        else if (newValue === 'depth') {
          // 深度模式
          if (priceSeries.current) priceSeries.current.applyOptions({ visible: true });
          if (volumeSeries.current) volumeSeries.current.applyOptions({ visible: false });
          if (cvdSeries.current) cvdSeries.current.applyOptions({ visible: false });
          
          // 添加订单簿深度可视化
          drawOrderBookDepth();
        }
        
        // 重新调整图表适应内容
        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error("Error changing chart type:", err);
    }
  };

  // 当交易数据变化时更新图表
  useEffect(() => {
    try {
      setIsLoading(false);
      
      // 确保图表已初始化
      if (!chartRef.current || !chartContainerRef.current) {
        console.log("Chart not initialized yet");
        return;
      }
      
      console.log("Updating chart with trade data:", tradeData.length);
      
      // 只有当有交易数据时才继续
      if (tradeData.length > 0) {
        // 更新最新价格
        if (tradeData[0]?.price) {
          setLastPrice(tradeData[0].price);
        }
        
        // 更新价格线数据
        if (priceSeries.current) {
          try {
            const processedData = tradeData.map(trade => ({
              time: trade.index, // 使用索引作为x轴
              value: trade.price
            }));
            
            if (processedData.length > 0) {
              console.log("Setting price data:", processedData.length);
              priceSeries.current.setData(processedData);
              
              // 异步设置第二次以确保显示
              setTimeout(() => {
                try {
                  if (priceSeries.current) {
                    priceSeries.current.setData(processedData);
                    chartRef.current.timeScale().fitContent();
                  }
                } catch (e) {
                  console.error("Error in delayed price update:", e);
                }
              }, 500);
            }
          } catch (chartErr) {
            console.error('Error updating price data:', chartErr);
          }
        }
        
        // 更新成交量数据
        if (volumeSeries.current) {
          try {
            const volumeData = tradeData.map(trade => ({
              time: trade.index, // 使用索引作为x轴
              value: trade.quantity,
              color: (trade.is_buyer_maker || false) ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)'
            }));
            
            if (volumeData.length > 0) {
              console.log("Setting volume data:", volumeData.length);
              volumeSeries.current.setData(volumeData);
            }
          } catch (volumeErr) {
            console.error('Error updating volume data:', volumeErr);
          }
        }
        
        // 更新累积成交量差数据
        if (cvdSeries.current && calculateCVD.length > 0) {
          try {
            console.log("Setting CVD data:", calculateCVD.length);
            cvdSeries.current.setData(calculateCVD);
          } catch (cvdErr) {
            console.error('Error updating CVD data:', cvdErr);
          }
        }
        
        // 调整图表以适应数据
        try {
          chartRef.current.timeScale().fitContent();
        } catch (err) {
          console.error("Error fitting chart content:", err);
        }
      }
    } catch (err) {
      console.error('Error processing trade data:', err);
      setError('Failed to process trade data');
    }
  }, [tradeData, calculateCVD]);
  
  // 当订单簿数据变化或图表类型变化时更新深度视图
  useEffect(() => {
    if (chartType === 'depth') {
      drawOrderBookDepth();
    }
  }, [depth, chartType, drawOrderBookDepth]);

  // 初始化图表
  useEffect(() => {
    console.log("Initializing chart", chartContainerRef.current ? "container exists" : "no container");
    
    if (!chartContainerRef.current) return;
    
    try {
      // 清理旧的图表实例
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        priceSeries.current = null;
        volumeSeries.current = null;
        cvdSeries.current = null;
      }
      
      // 获取容器尺寸
      const container = chartContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      console.log("Container size:", containerRect.width, "x", containerRect.height);
      
      // 确保容器有尺寸
      if (containerRect.width <= 10 || containerRect.height <= 10) {
        console.log("Container too small, delaying chart creation");
        setTimeout(() => {
          // 重新触发useEffect
          const event = new Event('resize');
          window.dispatchEvent(event);
        }, 500);
        return;
      }
      
      // 创建新图表
      const chart = createChart(container, {
        width: containerRect.width,
        height: containerRect.height,
        layout: {
          background: { type: ColorType.Solid, color: '#1e1e1e' },
          textColor: '#d1d4dc',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: '#2e2e2e' },
          horzLines: { color: '#2e2e2e' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: '#5c5c5c',
            style: LineStyle.Dashed,
          },
          horzLine: {
            width: 1,
            color: '#5c5c5c',
            style: LineStyle.Dashed,
          },
        },
        timeScale: {
          borderColor: '#3c3c3c',
          timeVisible: false, // 不显示时间，因为我们使用的是索引
          secondsVisible: false,
          barSpacing: 20, // 增加柱状图间距，使图表更清晰
        },
        rightPriceScale: {
          borderColor: '#3c3c3c',
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
          visible: true,
          autoScale: true,
        },
        leftPriceScale: {
          visible: false,
        },
        localization: {
          locale: 'en-US',
          priceFormatter: price => price.toFixed(2),
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
          axisPressedMouseMove: {
            time: true,
            price: true,
          },
        },
      });
      
      chartRef.current = chart;
      console.log("Chart created");

      // 添加价格线图系列
      priceSeries.current = chart.addLineSeries({
        color: '#1976d2',
        lineWidth: 2,
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineColor: '#1976d2',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        title: 'Price',
        lastValueVisible: true,
      });

      // 添加成交量直方图系列
      volumeSeries.current = chart.addHistogramSeries({
        color: 'rgba(76, 175, 80, 0.5)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        title: 'Volume',
      });
      
      // 添加累积成交量差系列
      cvdSeries.current = chart.addLineSeries({
        color: '#ff9800',
        lineWidth: 2,
        priceLineVisible: false,
        priceScaleId: 'cvd',
        scaleMargins: {
          top: 0.7,
          bottom: 0.1,
        },
        title: 'CVD',
        visible: false, // 初始不可见
      });
      
      // 手动立即触发更新图表数据
      setTimeout(() => {
        if (tradeData.length > 0 && priceSeries.current) {
          const processedData = tradeData.map(trade => ({
            time: trade.index,
            value: trade.price
          }));
          
          if (processedData.length > 0) {
            console.log("Initial data setting:", processedData.length);
            priceSeries.current.setData(processedData);
            chartRef.current.timeScale().fitContent();
          }
        }
        
        setIsLoading(false);
      }, 300);
      
      // 设置窗口调整大小的观察器
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !chartRef.current) return;
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          try {
            chartRef.current.applyOptions({ width, height });
            chartRef.current.timeScale().fitContent();
          } catch (resizeErr) {
            console.error('Error resizing chart:', resizeErr);
          }
        }
      });
      
      resizeObserver.observe(chartContainerRef.current);

      // 清理函数
      return () => {
        console.log("Cleaning up chart");
        resizeObserver.disconnect();
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (removeErr) {
            console.error('Error removing chart:', removeErr);
          } finally {
            chartRef.current = null;
            priceSeries.current = null;
            volumeSeries.current = null;
            cvdSeries.current = null;
          }
        }
      };
    } catch (err) {
      console.error('Error initializing chart:', err);
      setError('Failed to initialize chart: ' + err.message);
    }
  }, [tradeData.length]);  // 添加tradeData.length作为依赖，确保图表能够获取到数据

  // 安全渲染，包含错误处理
  const renderChart = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }
    
    if (!Array.isArray(tradeData) || tradeData.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography>No trade data available. The chart will show mock data for demo purposes.</Typography>
        </Box>
      );
    }
    
    return (
      <Box 
        ref={chartContainerRef}
        sx={{ 
          height: '100%',
          width: '100%',
          minHeight: '300px',  // 确保有最小高度
          borderRadius: 1,
          overflow: 'hidden',
          '& .tv-lightweight-charts': {
            width: '100% !important',
            height: '100% !important'
          }
        }}
      />
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      {/* 标题栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
        <Typography variant="h6" component="div">
          {formattedInstrument}
        </Typography>
        {lastPrice && (
          <Typography 
            variant="body1" 
            color={
              tradeData.length > 1 && tradeData[0]?.price > tradeData[1]?.price
                ? 'success.main' 
                : tradeData.length > 1 && tradeData[0]?.price < tradeData[1]?.price
                  ? 'error.main'
                  : 'text.secondary'
            }
            sx={{ 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {tradeData.length > 1 && tradeData[0] && tradeData[1] && (
              <Box component="span" sx={{ ml: 1, fontSize: '0.8rem' }}>
                {tradeData[0].price > tradeData[1].price ? '↑' : tradeData[0].price < tradeData[1].price ? '↓' : ''}
              </Box>
            )}
          </Typography>
        )}
      </Box>
      
      {/* 图表类型选择器 */}
      <Box sx={{ px: 2 }}>
        <Tabs 
          value={chartType} 
          onChange={handleChartTypeChange}
          variant="fullWidth"
          sx={{ mb: 1 }}
        >
          <Tab label="Price" value="price" />
          <Tab label="Order Flow" value="orderflow" />
          <Tab label="Depth" value="depth" />
        </Tabs>
      </Box>
      
      {/* 图表区域 */}
      <Box sx={{ 
        flex: 1, 
        minHeight: '300px',
        display: 'flex', 
        position: 'relative',
        overflow: 'hidden' 
      }}>
        {renderChart()}
      </Box>
      
      {/* 图表说明 */}
      <Box sx={{ px: 2, py: 0.5, fontSize: '0.75rem', color: 'text.secondary', borderTop: '1px solid', borderColor: 'divider' }}>
        {chartType === 'price' && (
          <Typography variant="caption">
            Showing price chart with volume. Large trades are highlighted briefly.
          </Typography>
        )}
        {chartType === 'orderflow' && (
          <Typography variant="caption">
            Showing Cumulative Volume Delta (CVD) with buy/sell pressure.
          </Typography>
        )}
        {chartType === 'depth' && (
          <Typography variant="caption">
            Order book visualization with support and resistance levels.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PriceChart; 