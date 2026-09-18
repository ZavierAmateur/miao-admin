<template>
  <el-result icon="warning" title="无权访问" sub-title="当前管理员没有访问该功能所需的权限。">
    <template #extra><el-button type="primary" @click="$router.push('/')">返回首页</el-button></template>
  </el-result>
</template>
