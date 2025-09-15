Component({
  behaviors: ['wx://component-export'],
  properties: {
    showIcons: Object,
    iconSize: { type: Number, value: 25 },
    quality: String,
    muted: Boolean,
    orientation: String,
    rotate: Number,
    fill: Boolean,
    fullScreen: Boolean,
    record: Boolean,
  },
  methods: {
    clickIcon({ currentTarget: { dataset } }) {
      this.triggerEvent('clickicon', { name: dataset.name });
    },
  },
});