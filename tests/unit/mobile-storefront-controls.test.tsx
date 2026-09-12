// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MobileReferenceHeader } from "@/components/storefront/MobileReferenceHeader";

const fixtureProps = () => ({
  searchQuery: "ساعة",
  onSearchChange: vi.fn(),
  onSubmitSearch: vi.fn(),
  cartCount: 0,
  unreadNotificationsCount: 0,
  onOpenCart: vi.fn(),
  onOpenMenu: vi.fn(),
  onSelectCategory: vi.fn(),
});
afterEach(cleanup);

describe("mobile storefront controls", () => {
  it("opens favorites through its own action instead of the account/menu action", () => {
    const props = fixtureProps();
    const onOpenWishlist = vi.fn();
    render(<MobileReferenceHeader {...props} onOpenWishlist={onOpenWishlist} />);
    fireEvent.click(screen.getByRole("button", { name: "المفضلة" }));
    expect(onOpenWishlist).toHaveBeenCalledOnce();
    expect(props.onOpenMenu).not.toHaveBeenCalled();
  });

  it("submits the same search with the icon and Enter", () => {
    const props = fixtureProps();
    render(<MobileReferenceHeader {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "تنفيذ البحث" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "البحث عن المنتجات" }), { key: "Enter" });
    expect(props.onSubmitSearch).toHaveBeenCalledTimes(2);
  });

  it("routes the menu and category expander to the menu action", () => {
    const props = fixtureProps();
    render(<MobileReferenceHeader {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "القائمة الرئيسية" }));
    fireEvent.click(screen.getByRole("button", { name: "عرض جميع الفئات" }));
    expect(props.onOpenMenu).toHaveBeenCalledTimes(2);
    expect(props.onOpenCart).not.toHaveBeenCalled();
  });

  it("does not offer camera search or actions without destinations", () => {
    render(<MobileReferenceHeader {...fixtureProps()} />);
    expect(screen.queryByRole("button", { name: "البحث بالكاميرا" })).toBeNull();
    expect(screen.queryByRole("button", { name: "المفضلة" })).toBeNull();
    expect(screen.queryByRole("button", { name: "الإشعارات" })).toBeNull();
  });

  it("keeps cart and notification actions independent", () => {
    const props = fixtureProps();
    const onOpenNotifications = vi.fn();
    render(<MobileReferenceHeader {...props} onOpenNotifications={onOpenNotifications} />);
    fireEvent.click(screen.getByRole("button", { name: "السلة" }));
    fireEvent.click(screen.getByRole("button", { name: "الإشعارات" }));
    expect(props.onOpenCart).toHaveBeenCalledOnce();
    expect(onOpenNotifications).toHaveBeenCalledOnce();
    expect(props.onOpenMenu).not.toHaveBeenCalled();
  });

  it("reflects the selected category instead of always marking All active", () => {
    const props = fixtureProps();
    const { rerender } = render(<MobileReferenceHeader {...props} selectedCategory="all" />);
    fireEvent.click(screen.getByRole("button", { name: "نساء" }));
    expect(props.onSelectCategory).toHaveBeenCalledWith("women");
    rerender(<MobileReferenceHeader {...props} selectedCategory="women" />);
    expect(screen.getByRole("button", { name: "نساء" }).getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("button", { name: "كل", exact: true }).getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
