const imgConfig = {
  id: 'markdown',
  toolbars: {
    toolbar: ['bold', 'italic', 'strikethrough', '|', 'header', 'list', 'graph'],
  },
  editor: {
    height: '70%',
    maxUrlLength: -1,
  },
  previewer: {
    lazyLoadImg: {
      // 加载图片时如果需要展示loading图，则配置loading图的地址
      loadingImgPath: '',
      // 同一时间最多有几个图片请求，最大同时加载6张图片
      maxNumPerTime: 2,
      // 不进行懒加载处理的图片数量，如果为0，即所有图片都进行懒加载处理， 如果设置为-1，则所有图片都不进行懒加载处理
      noLoadImgNum: 3,
      // 首次自动加载几张图片（不论图片是否滚动到视野内），autoLoadImgNum = -1 表示会自动加载完所有图片
      autoLoadImgNum: 2,
      // 针对加载失败的图片 或 beforeLoadOneImgCallback 返回false 的图片，最多尝试加载几次，为了防止死循环，最多5次。以图片的src为纬度统计重试次数
      maxTryTimesPerSrc: 2,
      // 加载一张图片之前的回调函数，函数return false 会终止加载操作
      beforeLoadOneImgCallback: (img) => {
        return true;
      },
      // 加载一张图片失败之后的回调函数
      failLoadOneImgCallback: (img) => {},
      // 加载一张图片之后的回调函数，如果图片加载失败，则不会回调该函数
      afterLoadOneImgCallback: (img) => {},
      // 加载完所有图片后调用的回调函数
      afterLoadAllImgCallback: () => {
        alert('all img lond done');
      },
    },
  },
};

export { imgConfig };
