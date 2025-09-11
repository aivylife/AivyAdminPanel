<script setup lang="jsx">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps({
  series: {
    type: Array,
    default: () => [],
  },
  typeChart: String,
  height: String,
  categories: {
    type: Array,
    default: () => [],
  },
  xAxisType: String,
  startDate: [String, Number],
  endDate: String,
  loading: { type: Boolean, default: false },
});

// Ссылка на Quasar для получения переменных темы
const $q = useQuasar();

// Ссылки на график и контейнер
const chartRef = ref(null);
const chartContainerRef = ref(null);

// Массив для хранения созданных оверлеев
const overlayElements = [];

// Цвета по умолчанию
const defaultColors = ['#2E93fA', '#8C62FF', '#2DD4BF', '#FFC837', '#FE964A', '#EBF3FF'];

// Убеждаемся, что props.series является массивом
const series = computed(() => {
  if (!Array.isArray(props.series)) return [];

  // Если categories пустой, значит данные приходят в формате [x, y]
  if (!props.categories?.length) {
    return props.series.map(s => ({
      ...s,
      data: s.data.map(point => ({
        x: point[0],
        y: point[1]
      }))
    }));
  }

  return props.series;
});

// Функция для получения цвета из темы
function getColorFromTheme(colorName) {
  const themeColors = {
    primary: '#2F78EE',
    secondary: '#5F666D',
    accent: '#10083F',
    positive: '#61CA45',
    negative: '#FF5A43',
    info: '#0C4DCE',
    warning: '#FFD400',
    red: '#FF5A43',
    yellow: '#FFD400',
    green: '#61CA45',
    blue: '#0C4DCE',
    purple: '#8C62FF',
    orange: '#FE964A',
  };
  return themeColors[colorName.toLowerCase()] || colorName;
}

// Генерация цветов для серий
const seriesColors = computed(() => {
  return series.value.map((s, index) => {
    if (s.color) {
      return getColorFromTheme(s.color);
    }
    return defaultColors[index % defaultColors.length];
  });
});

// Обновляем серии данных, добавляя цвет и тип
const updatedSeries = computed(() => {
  return series.value.map((s, index) => {
    const color = seriesColors.value[index];
    return {
      ...s,
      type: s.type || props.typeChart,
      color: color,
      fillColor: color,
    };
  });
});

// Индексы серий типа 'column' или 'bar'
const columnSeriesIndices = computed(() => {
  return updatedSeries.value
    .map((s, index) => (s.type === 'column' || s.type === 'bar' ? index : null))
    .filter((index) => index !== null);
});

// Определяем, есть ли одновременно серии типа 'column' и 'line'
const hasColumnSeries = computed(() => {
  return updatedSeries.value.some((s) => s.type === 'column' || s.type === 'bar');
});

const hasLineSeries = computed(() => {
  return updatedSeries.value.some((s) => s.type === 'line' || s.type === 'area');
});

// Добавляем yAxisIndex для серий
const finalSeries = computed(() => {
  // Если есть и 'column', и 'line' серии, назначаем разные оси Y
  if (hasColumnSeries.value && hasLineSeries.value) {
    return updatedSeries.value.map((s) => {
      return {
        ...s,
        yAxisIndex: s.type === 'column' || s.type === 'bar' ? 0 : 1, // 0 - левая ось Y, 1 - правая ось Y
      };
    });
  } else {
    // В противном случае используем одну ось Y (по умолчанию 0)
    return updatedSeries.value;
  }
});

function formatValue(value) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function getXaxis() {
  // Проверяем наличие категорий и что они не пустые
  if (props.xAxisType === 'category' && props.categories?.length > 0) {
    return {
      type: 'category',
      labels: {
        formatter: (val) => val,
        style: { colors: '#93979C' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      categories: props.categories.map((c) => c.label || ''),
    };
  } else if (series.value.length > 0 && series.value[0].data?.length > 0) {
    // Проверяем формат данных - если первый элемент массива является массивом [x, y]
    const firstPoint = series.value[0].data[0];
    if (Array.isArray(firstPoint) && firstPoint.length === 2) {
      return {
        type: 'datetime',
        labels: {
          style: { colors: '#93979C' },
          datetimeFormatter: {
            year: 'yyyy',
            month: 'MMM',
            day: 'dd MMM',
            hour: 'HH:mm'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      };
    }
  }
  
  // Если ни одно из условий не выполнилось, возвращаем базовую настройку
  return {
    type: 'category',
    labels: {
      style: { colors: '#93979C' },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  };
}

function getBarColumnWidth() {
  let dataPoints = 0;

  const barSeries = updatedSeries.value.filter(
    (series) => series.type === 'bar' || series.type === 'column'
  );

  if (props.xAxisType === 'category' && props.categories.length) {
    dataPoints = props.categories.length * barSeries.length;
  } else {
    dataPoints =
      Math.max(
        ...barSeries.map((series) => (Array.isArray(series.data) ? series.data.length : 0))
      ) * barSeries.length;
  }

  if (dataPoints === 1) {
    return '10%';
  } else if (dataPoints < 3) {
    return '20%';
  } else if (dataPoints < 5) {
    return '15%';
  } else if (dataPoints > 10) {
    return '80%';
  } else {
    return `${70 - dataPoints * 3}%`;
  }
}

// Опции для графика
const chartOptions = computed(() => {
  // Настраиваем оси Y в зависимости от наличия разных типов серий
  let yaxisOptions;

  if (hasColumnSeries.value && hasLineSeries.value) {
    // Две оси Y
    yaxisOptions = [
      {
        // Левая ось Y для 'column' серий
        labels: {
          style: { colors: '#93979C' },
          formatter: formatValue,
        },
        title: {
          text: 'Column',
          style: { color: '#93979C' },
        },
      },
      {
        // Правая ось Y для 'line' серий
        opposite: true,
        labels: {
          style: { colors: '#93979C' },
          formatter: formatValue,
        },
        title: {
          text: 'Line',
          style: { color: '#93979C' },
        },
      },
    ];
  } else {
    // Одна ось Y по умолчанию
    yaxisOptions = {
      labels: {
        style: { colors: '#93979C' },
        formatter: formatValue,
      },
    };
  }

  return {
    chart: {
      height: 350,
      type: props.typeChart,
      animations: {
        enabled: false,
        dynamicAnimation: {
          enabled: true
        }
      },
      events: {
        mounted: () => {
          setTimeout(setupLinks, 0);
        },
        zoomed: () => {
          setTimeout(setupLinks, 0);
        },
        scrolled: () => {
          setTimeout(setupLinks, 0);
        },
        updated: () => {
          setTimeout(setupLinks, 0);
        },
      },
    },
    dataLabels: columnSeriesIndices.value.length > 0 && columnSeriesIndices.value.length < 3
      ? {
        enabled: true,
        offsetY: -10,
        enabledOnSeries: columnSeriesIndices.value,
        style: {
          fontSize: '12px',
          colors: ['#304758'],
        },
        formatter: (val) => val === 0 ? '' : val
      }
      : {
        enabled: false,
      },
    grid: {
      xaxis: { lines: { show: false } },
      borderColor: '#272B30',
    },
    yaxis: yaxisOptions,
    xaxis: getXaxis(),
    legend: {
      itemMargin: {
        horizontal: 10,
        vertical: 0
      },
      show: true,
      position: 'top',
      markers: { strokeWidth: 0, offsetX: -4, },
      horizontalAlign: 'left',
      labels: { colors: '#FFFFFF' },
    },
    noData: {
      text: 'No data',
      style: { color: '#FFFFFF', fontSize: '14px' },
    },
    colors: seriesColors.value,
    fill: {
      colors: seriesColors.value,
    },
    stroke: {
      colors: seriesColors.value,
      width: finalSeries.value.map(s => (s.type === 'column' || s.type === 'bar') ? 0 : 4)
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      }
    },
    plotOptions: {
      bar: {
        columnWidth: getBarColumnWidth(),
      },
    },
  };
});

// Функция для настройки ссылок внутри графика
function setupLinks() {
  // Удаляем предыдущие оверлеи
  overlayElements.forEach((el) => el.remove());
  overlayElements.length = 0;

  if (chartRef.value && props.categories.length) {
    const chartElement = chartRef.value.$el;
    if (chartElement) {
      const labels = chartElement.querySelectorAll('.apexcharts-xaxis-texts-g text');
      if (labels.length === 0) {
        setTimeout(setupLinks, 50);
        return;
      }
      labels.forEach((label, index) => {
        const category = props.categories[index];
        if (category && category.webUrl) {
          const labelRect = label.getBoundingClientRect();
          const chartRect = chartContainerRef.value.getBoundingClientRect();

          const clickableOverlay = document.createElement('div');
          clickableOverlay.className = 'clickable-overlay';
          clickableOverlay.style.position = 'absolute';
          clickableOverlay.style.top = `${labelRect.top - chartRect.top}px`;
          clickableOverlay.style.left = `${labelRect.left - chartRect.left}px`;
          clickableOverlay.style.width = `${labelRect.width}px`;
          clickableOverlay.style.height = `${labelRect.height}px`;
          clickableOverlay.style.cursor = 'pointer';
          clickableOverlay.style.zIndex = '10';
          clickableOverlay.style.backgroundColor = 'transparent';

          clickableOverlay.addEventListener('click', () => {
            window.open(category.webUrl, '_blank');
          });

          chartContainerRef.value.appendChild(clickableOverlay);
          overlayElements.push(clickableOverlay);
        }
      });
    }
  }
}

// Следим за обновлением данных и вызываем setupLinks
watch(
  () => [props.categories, props.series],
  () => {
    if (props.categories.length) {
      setupLinks();
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  overlayElements.forEach((el) => el.remove());
  overlayElements.length = 0;
});
</script>

<template>
  <div ref="chartContainerRef" style="position: relative;">
    <apexchart
      v-if="!loading"
      ref="chartRef"
      :key="chartOptions"
      :type="typeChart"
      :height="height || '350'"
      :options="chartOptions"
      :series="finalSeries"
    />
    <q-spinner
      v-else
      class="full-width content-center text-center items-center"
      color="primary"
      size="7em"
      :thickness="2"
    />
  </div>
</template>

<style scoped>
.clickable-overlay {
  pointer-events: all;
}
</style> 