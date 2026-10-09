import { Component } from 'react';
import { SceneFallback } from '@/3d/components/SceneFallback';

export class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('GalaxyScene:', error);
  }

  render() {
    return this.state.failed ? <SceneFallback /> : this.props.children;
  }
}
