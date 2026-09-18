<template>
  <section>
    <header class="page-heading"><h1>仪表盘</h1><p>聚合指标将在后端管理 API 提供稳定数据源后接入。</p></header>
    <el-alert title="当前为工程基线" description="不从玩家业务接口或数据库临时拼装管理指标。" type="info" :closable="false" show-icon />
    <div class="metric-grid">
      <el-card v-for="item in ['登录成功率', '云存档成功率', '存档冲突率', '服务 P95']" :key="item" shadow="never">
        <span>{{ item }}</span><strong>--</strong><small>等待指标接口</small>
      </el-card>
    </div>
  </section>
</template>

<style scoped>
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 22px; }
.metric-grid span, .metric-grid strong, .metric-grid small { display: block; }
.metric-grid span { color: #697386; font-size: 13px; }
.metric-grid strong { margin: 18px 0 8px; color: #172033; font-size: 30px; }
.metric-grid small { color: #9aa3b2; }
</style>
