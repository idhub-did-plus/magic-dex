import React, { HTMLAttributes } from 'react';
import styled from 'styled-components';

import { Dropdown, DropdownPositions } from '../common/dropdown';
import { ChevronDownIcon } from '../common/icons/chevron_down_icon';

import { ThemeSelectionStatusDot } from './theme_selection_status_dot';

const ThemeSelectionStatusWrapper = styled.div`
    align-items: center;
    cursor: pointer;
    display: flex;
`;

const WalletConnectionStatusDotStyled = styled(ThemeSelectionStatusDot)`
    margin-right: 10px;
`;

const WalletConnectionStatusText = styled.span`
    color: ${props => props.theme.componentsTheme.textColorCommon};
    font-feature-settings: 'calt' 0;
    font-size: 16px;
    font-weight: 500;
    margin-right: 10px;
`;

interface OwnProps extends HTMLAttributes<HTMLSpanElement> {
    themeSelectionContent: React.ReactNode;
    shouldCloseDropdownOnClickOutside?: boolean;
    headerText: string;
    theme: string|null;
}

type Props = OwnProps;

export class ThemeSelectionStatusContainer extends React.PureComponent<Props> {
    public render = () => {
        const {
            headerText,
            themeSelectionContent,
            theme,
            shouldCloseDropdownOnClickOutside,
            ...restProps
        } = this.props;
        const status: string = theme ? 'active' : '';
        const header = (
            <ThemeSelectionStatusWrapper>
                <WalletConnectionStatusDotStyled status={status} />
                <WalletConnectionStatusText>{headerText}</WalletConnectionStatusText>
                <ChevronDownIcon />
            </ThemeSelectionStatusWrapper>
        );

        const body = <>{themeSelectionContent}</>;
        return (
            <Dropdown
                body={body}
                header={header}
                horizontalPosition={DropdownPositions.Right}
                shouldCloseDropdownOnClickOutside={shouldCloseDropdownOnClickOutside}
                {...restProps}
            />
        );
    };
}
