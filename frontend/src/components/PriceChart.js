import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { Box, Typography, CircularProgress, Tabs, Tab } from '@mui/material';

// 基础图表组件
const PriceChart = ({ 
  data = [], 
  instrument = 'BTC-USDT',
  depth = { bids: [], asks: [] }
}) => {
  const chartContainerRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState('price');
  const [error, setError] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);

  // 处理图表类型切换
  const handleChartTypeChange = (event, newValue) => {
    setChartType(newValue);
  };

  // 在组件挂载和数据变化时创建/更新图表
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // 创建模拟数据（如果没有真实数据）
    const chartData = [];
    const now = Math.floor(Date.now() / 1000);
    const timeStep = 3600; // 1小时
    
    // 生成示例数据
    for (let i = 0; i < 24; i++) {
      const time = now - (24 - i) * timeStep;
      const value = 20000 + Math.random() * 2000 - 1000;
      chartData.push({
        time,
        value
      });
    }
    
    try {
      // 清除现有内容
      chartContainerRef.current.innerHTML = '';
      
      // 获取容器尺寸
      const width = chartContainerRef.current.clientWidth || 400;
      const height = chartContainerRef.current.clientHeight || 300;
      
      // 创建图表
      const chart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { color: '#1E1E1E' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#2e2e2e' },
          horzLines: { color: '#2e2e2e' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        }
      });
      
      // 添加价格线
      const lineSeries = chart.addLineSeries({
        color: '#1976d2',
        lineWidth: 2,
      });
      
      // 设置数据
      lineSeries.setData(chartData);
      
      // 添加图表调整大小功能
      const handleResize = () => {
        if (chartContainerRef.current) {
          const width = chartContainerRef.current.clientWidth;
          const height = chartContainerRef.current.clientHeight;
          chart.applyOptions({ width, height });
          chart.timeScale().fitContent();
        }
      };
      
      // 添加resize监听
      window.addEventListener('resize', handleResize);
      
      // 设置加载完成
      setIsLoading(false);
      
      // 如果有真实数据，更新最新价格
      if (data && data.length > 0 && data[0].price) {
        setLastPrice(parseFloat(data[0].price));
      } else {
        setLastPrice(chartData[chartData.length - 1].value);
      }
      
      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      console.error('Error creating chart:', err);
      setError(`Chart error: ${err.message}`);
      setIsLoading(false);
    }
  }, [data]);

  // 渲染函数
  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      {/* 标题栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
        <Typography variant="h6" component="div">
          {instrument}
        </Typography>
        {lastPrice && (
          <Typography 
            variant="body1" 
            color="text.primary"
            sx={{ fontWeight: 'bold' }}
          >
            ${lastPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
        position: 'relative',
        overflow: 'hidden' 
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box 
            ref={chartContainerRef}
            sx={{ 
              height: '100%',
              width: '100%',
              minHeight: '300px'
            }}
          />
        )}
      </Box>
      
      {/* 图表说明 */}
      <Box sx={{ px: 2, py: 0.5, fontSize: '0.75rem', color: 'text.secondary', borderTop: '1px solid', borderColor: 'divider' }}>
        {chartType === 'price' && (
          <Typography variant="caption">
            Showing price chart with demo data.
          </Typography>
        )}
        {chartType === 'orderflow' && (
          <Typography variant="caption">
            Order flow analysis will be available soon.
          </Typography>
        )}
        {chartType === 'depth' && (
          <Typography variant="caption">
            Order book depth visualization will be available soon.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PriceChart; 