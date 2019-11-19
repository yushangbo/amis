import {ClassNamesFn, themeable} from '../theme';
import React from 'react';
import {render} from 'react-dom';
import {autobind} from '../utils/helper';
import Transition, {
  ENTERED,
  ENTERING,
  EXITING
} from 'react-transition-group/Transition';
import {Portal} from 'react-overlays';
const fadeStyles: {
  [propName: string]: string;
} = {
  [ENTERING]: 'in',
  [ENTERED]: 'in',
  [EXITING]: 'out'
};

interface ContextMenuProps {
  className?: string;
  classPrefix: string;
  classnames: ClassNamesFn;
  container?: HTMLElement | null | (() => HTMLElement);
}

export type MenuItem = {
  label: string;
  icon?: string;
  disabled?: boolean;
  children?: Array<MenuItem | MenuDivider>;
  data?: any;
  onSelect?: (data: any) => void;
};

export type MenuDivider = '|';

interface ContextMenuState {
  isOpened: boolean;
  menus: Array<MenuItem | MenuDivider>;
  x: number;
  y: number;
}

export class ContextMenu extends React.Component<
  ContextMenuProps,
  ContextMenuState
> {
  static instance: any = null;
  static getInstance() {
    if (!ContextMenu.instance) {
      const container = document.body;
      const div = document.createElement('div');
      container.appendChild(div);
      render(<ThemedContextMenu />, div);
    }

    return ContextMenu.instance;
  }

  state = {
    isOpened: false,
    menus: [],
    x: -99999,
    y: -99999
  };

  menuRef: React.RefObject<HTMLDivElement> = React.createRef();
  componentWillMount() {
    ContextMenu.instance = this;
  }

  componentDidMount() {
    document.body.addEventListener('click', this.handleOutClick, true);
  }

  componentWillUnmount() {
    ContextMenu.instance = null;
    document.body.removeEventListener('click', this.handleOutClick, true);
  }

  @autobind
  openContextMenus(info: {x: number; y: number}, menus: Array<MenuItem>) {
    this.setState({
      isOpened: true,
      x: info.x,
      y: info.y,
      menus: menus
    });
  }

  @autobind
  close() {
    this.setState({
      isOpened: false,
      x: -99999,
      y: -99999,
      menus: []
    });
  }

  @autobind
  handleOutClick(e: Event) {
    if (
      !e.target ||
      !this.menuRef.current ||
      this.menuRef.current.contains(e.target as HTMLElement)
    ) {
      return;
    }
    this.close();
  }

  handleClick(item: MenuItem) {
    item.disabled ||
      (Array.isArray(item.children) && item.children.length) ||
      this.setState(
        {
          isOpened: false,
          x: -99999,
          y: -99999,
          menus: []
        },
        () => (item.onSelect ? item.onSelect(item.data) : null)
      );
  }

  renderMenus(menus: Array<MenuItem | MenuDivider>) {
    const {classnames: cx} = this.props;

    return menus.map((item, index) => {
      if (item === '|') {
        return <li key={index} className={cx('ContextMenu-divider')} />;
      }

      const hasChildren = Array.isArray(item.children) && item.children.length;
      return (
        <li
          key={item.label}
          className={cx('ContextMenu-item', {
            'has-child': hasChildren,
            'is-disabled': item.disabled
          })}
        >
          <a onClick={this.handleClick.bind(this, item)}>
            {item.icon ? <span className={item.icon} /> : null}
            {item.label}
          </a>
          {hasChildren ? (
            <ul className={cx('ContextMenu-subList')}>
              {this.renderMenus(item.children!)}
            </ul>
          ) : null}
        </li>
      );
    });
  }

  render() {
    const {className, container, classnames: cx} = this.props;

    return (
      <Portal container={container}>
        <Transition
          mountOnEnter
          unmountOnExit
          in={this.state.isOpened}
          timeout={500}
        >
          {(status: string) => (
            <div
              ref={this.menuRef}
              role="contextmenu"
              className={cx('ContextMenu', className)}
            >
              <div
                style={{left: `${this.state.x}px`, top: `${this.state.y}px`}}
                className={cx(`ContextMenu-menu`, fadeStyles[status])}
              >
                <ul className={cx('ContextMenu-list')}>
                  {this.renderMenus(this.state.menus)}
                </ul>
              </div>
            </div>
          )}
        </Transition>
      </Portal>
    );
  }
}

export const ThemedContextMenu = themeable(ContextMenu);
export default ThemedContextMenu;

export function openContextMenus(
  info: Event | {x: number; y: number},
  menus: Array<MenuItem | MenuDivider>
) {
  return ContextMenu.getInstance().openContextMenus(info, menus);
}